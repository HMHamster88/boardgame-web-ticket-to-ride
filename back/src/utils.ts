import { getMaxElement, getMaxElementWithDefault, recordEntries, toMap } from "boardgame-web-common";
import type { FieldData, RailPathData } from "./fields/fieldData";
import { TrainType, type CityGraph, type CityGraphNode, type LongestPath, type TicketToRidePlayerPublicState, type TicketToRidePublicGameState, type TrainCards } from "./types/types";

export function getColorTrainTypesCount(trainCards: TrainCards) {
    return recordEntries(trainCards)
        .filter(([type, count]) => count > 0 && type != TrainType.LOCOMOTIVE).length
}

export function checkBuildCards(buildCards: TrainCards, availableCards: TrainCards): boolean {
    if (getColorTrainTypesCount(buildCards) > 1) {
        return false
    }
    if (recordEntries(availableCards).some(([type, availableCardCount]) => {
        return buildCards[type] > availableCardCount
    })) {
        return false
    }
    return true
}

export function getAllTrainCardsCount(trainCards: TrainCards): number {
    return Object.values(trainCards).reduce((a, c) => a + c, 0)
}

export function substractTrainCards(source: TrainCards, toSubstract: TrainCards) {
    return recordEntries(source).forEach(([type, count]) => source[type] = source[type] - toSubstract[type])
}

export function getRequiredStaionCardsCount(playerPubicState: TicketToRidePlayerPublicState) {
    return 4 - playerPubicState.stations
}

function findLongetstRoadFromCity(cityNode: CityGraphNode, path: Set<string>, playerPathIds: Set<string>): Set<string> {
    const subPaths = [...cityNode.rails.entries()]
        .map(([railId, subNode]) => {
            if (!playerPathIds.has(railId) || path.has(railId)) {
                return undefined
            }
            return findLongetstRoadFromCity(subNode, new Set<string>([...path, railId]), playerPathIds)
        })
        .filter(path => path != undefined)
    return getMaxElementWithDefault(subPaths, path => path.size, path)
}

function findLongestPathForPlayer(cityGraph: CityGraph, buildedPlayerPaths: RailPathData[]) {
    const playerCityIds = new Set<string>()
    const playerPathIds = new Set<string>()
    buildedPlayerPaths.forEach(path => {
        playerPathIds.add(path.id)
        playerCityIds.add(path.from)
        playerCityIds.add(path.to)
    })
    const longestPaths = [...playerCityIds].map(cityId => findLongetstRoadFromCity(cityGraph.get(cityId)!, new Set<string>(), playerPathIds))
    return getMaxElement(longestPaths, path => path.size)
}

export function findLongestPath(cityGraph: CityGraph, publicState: TicketToRidePublicGameState, fieldData: FieldData) {
    const railPathsByIds = toMap(fieldData.railPaths, path => path.id)
    const longestPaths = publicState.playersStates.map(player => {
        const buildedPlayerPaths = publicState.buildedRailPaths
            .filter(path => path.playerId == player.playerId)
            .map(path => railPathsByIds.get(path.id))
            .filter(path => path != undefined)
        const longestPath = findLongestPathForPlayer(cityGraph, buildedPlayerPaths)
        if (!longestPath) {
            return undefined
        }
        return {
            playerId: player.playerId,
            pathIds: [...longestPath]
        } as LongestPath
    })
        .filter(path => path != undefined)
    return getMaxElement(longestPaths, path => path.pathIds.length)
}

function addToMapArray<K, V>(key: K, value: V, map: Map<K, V[]>) {
    let array = map.get(key)
    if (!array) {
        array = []
        map.set(key, array)
    }
    array.push(value)
}

function anotherCityId(cityId: string, path: RailPathData) {
    return cityId == path.from ? path.to : path.from
}

export function createCityGraph(field: FieldData): CityGraph {
    const pathsByCityId = new Map<string, RailPathData[]>()
    field.railPaths.forEach(path => {
        addToMapArray(path.from, path, pathsByCityId)
        addToMapArray(path.to, path, pathsByCityId)
    })

    const result = new Map<string, CityGraphNode>(field.cities.map(city => {
        const cityNode: CityGraphNode = {
            cityId: city.id,
            rails: new Map<string, CityGraphNode>()
        }
        return [city.id, cityNode]
    }))

    for (let [cityId, cityNode] of result.entries()) {
        const cityPaths = pathsByCityId.get(cityId)
        if (!cityPaths) {
            throw new Error(`No paths with cityId "${cityId}"`)
        }
        cityNode.rails = new Map<string, CityGraphNode>(
            cityPaths.map(path => [path.id, result.get(anotherCityId(cityId, path))!])
        )
    }

    return result
}