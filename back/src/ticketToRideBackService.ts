import {
    distinct,
    GameStatusEnum,
    getMaxElement,
    getRandomInt,
    getShuffledArray,
    handleMessage,
    initEnumRecord,
    randomEnumVal,
    removeElements,
    type BotGameContext,
    type Game,
    type GameAction,
    type GameBackService,
    type GameContext,
    type GameSettings,
    type GameState,
    type MesasgeHandlers
} from "boardgame-web-common/back";
import {
    longestPathPoints,
    pointsByRailLength,
    stationPoints,
    TicketToRideFieldType,
    TicketToRideGamePhase,
    TrainType,
    type CityGraph,
    type CityGraphNode,
    type PlayerStatistics,
    type RouteStatistics,
    type TicketToRideGameSettings,
    type TicketToRideGameStatistics,
    type TicketToRidePlayerPrivateState,
    type TicketToRidePlayerPublicState,
    type TicketToRidePrivateGameState,
    type TicketToRidePublicGameState
} from "./types/types";

import packageInfo from '../../package.json' with { type: 'json' };
import { fieldsDatas, type Route } from "./fields/fieldData";
import type { BuildRailPathAction, BuildStationAction, GetClosedTrainCardsAction, GetNewRoutesAction, GetOpenedTrainCardAction, SubmitNewRoutesAction } from "./types/actions";
import { checkBuildCards, createCityGraph, findLongestPath, getAllTrainCardsCount, getRequiredStaionCardsCount, substractTrainCards } from "./utils";


export const TicketToRideStaticSettings = {
    minPlayers: 2,
    maxPlayers: 6
}

const startTrainCardsCount = 4
const opendedTrainCardsCount = 5
const startTrainsCount = 45
const startStationsCount = 3
const startRoutesCount = 3
const newRoutesCount = 3

const maxOpenedLocomotives = 3
const closedCardGetCount = 2

const lastLoopTrainCount = 2

const tunnelCardsCount = 3


export class TicketToRideGameBackService implements GameBackService {
    version = packageInfo.version
    homepage = packageInfo.homepage

    startGame(game: Game, gameSettings: GameSettings): GameState {
        const settings = gameSettings as TicketToRideGameSettings
        const publicPlayersStates = game.players.map(player => {
            const state: TicketToRidePlayerPublicState = {
                playerId: player.userId,
                points: 0,
                cardsCount: 0,
                trains: startTrainsCount,
                stations: startStationsCount
            }
            return state
        })
        const fieldData = fieldsDatas[settings.fieldType]
        const statisctics: TicketToRideGameStatistics = {
            turnCount: 0,
            playersStatistics: publicPlayersStates.map(ps => {
                const stats: PlayerStatistics = {
                    playerId: ps.playerId,
                    routeStatistics: [],
                    buildedPaths: [],
                    stations: 0,
                    longestPath: false,
                }
                return stats
            })
        }

        const publicState: TicketToRidePublicGameState = {
            phase: TicketToRideGamePhase.CHOOSE_START_ROUTES,
            activePlayerIndex: getRandomInt(0, game.players.length - 1),
            winnersIds: [],
            playersStates: publicPlayersStates,
            statistics: statisctics,
            openedTrainCards: this.randomTrainCards(opendedTrainCardsCount),
            buildedRailPaths: [],
            stations: [],
            lastPlayerId: undefined,
            longestPath: undefined
        }

        const routesDeck = getShuffledArray(fieldData.routes.filter(route => !route.isLong).map(route => route.id))
        const longRoutesDeck = getShuffledArray(fieldData.routes.filter(route => route.isLong).map(route => route.id))


        const privatePlayerStates = game.players.map(player => {
            const trains = initEnumRecord<TrainType, number>(TrainType, {}, 0)
            for (let i = 0; i < startTrainCardsCount; i++) {
                const trainType = randomEnumVal(TrainType)
                trains[trainType] = trains[trainType] + 1
            }
            const state: TicketToRidePlayerPrivateState = {
                playerId: player.userId,
                trainCards: trains,
                routesToChoose: [...routesDeck.splice(0, startRoutesCount), ...longRoutesDeck.splice(0, 1)],
                routes: [],
                finsishedRoutes: []
            }
            return state
        })

        const privateState: TicketToRidePrivateGameState = {
            playersStates: privatePlayerStates,
            routesDeck: routesDeck,
            routesDiscardPile: [],
            openedCardsGetCount: 0
        }

        const gameState: GameState = {
            id: game.id,
            publicState: publicState,
            privateState: privateState
        }

        game.status = GameStatusEnum.STARTED

        return gameState
    }

    type = 'TICKET_TO_RIDE'
    localizedName = {
        en: {
            TICKET_TO_RIDE: 'Ticket to Ride'
        },
        ru: {
            TICKET_TO_RIDE: 'Билет на поезд'
        }
    }

    gameStaticSettings = TicketToRideStaticSettings

    getDefaultSettings(): GameSettings {
        const settings: TicketToRideGameSettings = {
            id: '',
            fieldType: TicketToRideFieldType.EUROPE
        }
        return settings
    }

    randomTrainCards(count: number) {
        return Array.from({ length: count }, () => randomEnumVal(TrainType))
    }

    countPoints(publicState: TicketToRidePublicGameState, privateState: TicketToRidePrivateGameState, fieldType: TicketToRideFieldType,
        statistics: TicketToRideGameStatistics) {
        const fieldData = fieldsDatas[fieldType]

        publicState.longestPath = publicState.longestPath = findLongestPath(this.getCityGraph(fieldType), publicState, fieldData)
        if (publicState.longestPath) {
            const publicPlayerState = publicState.playersStates.find(ps => ps.playerId == publicState.longestPath?.playerId)!
            publicPlayerState.points += longestPathPoints
            const playerStats = statistics.playersStatistics.find(stats => stats.playerId == publicState.longestPath?.playerId)!

            console.log('longestPath', publicPlayerState.points)
            playerStats.longestPath = true
        }



        for (let player of privateState.playersStates) {
            const publicPlayerState = publicState.playersStates.find(ps => ps.playerId == player.playerId)!
            const routeStats: RouteStatistics[] = []
            player.routes.forEach(routeId => {
                const route = fieldData.routes.find(route => route.id == routeId)!
                if (player.finsishedRoutes.includes(routeId)) {
                    publicPlayerState.points += route.points
                    routeStats.push({
                        routeId: route.id,
                        points: route.points
                    })
                } else {
                    publicPlayerState.points -= route.points
                    routeStats.push({
                        routeId: route.id,
                        points: -route.points
                    })
                }
            })
            publicPlayerState.points += publicPlayerState.stations * stationPoints
            console.log('stations', publicPlayerState.points)
            const playerStats = statistics.playersStatistics.find(stat => stat.playerId == player.playerId)!
            playerStats.routeStatistics = routeStats
            playerStats.stations = publicPlayerState.stations
        }

    }

    async performAction(gameContext: GameContext, gameAction: GameAction, playerId: string): Promise<void> {
        const game = gameContext.game
        const gameState = gameContext.gameState
        const settings = gameContext.gameSettings as TicketToRideGameSettings
        const fieldData = fieldsDatas[settings.fieldType]
        if (!gameState) {
            return
        }
        const publicState = gameState.publicState as TicketToRidePublicGameState
        const statistics = gameState.publicState.statistics as TicketToRideGameStatistics
        const privateState = gameState.privateState as TicketToRidePrivateGameState
        const activePlayer = game.players[publicState.activePlayerIndex]
        const activePlayerId = activePlayer?.userId
        const privatePlayerState = privateState.playersStates.find(pl => pl.playerId == playerId)!
        const publicPlayerState = publicState.playersStates.find(pl => pl.playerId == playerId)!
        const isActivePlayerAction = playerId == activePlayerId
        const playerStats = statistics.playersStatistics.find(pl => pl.playerId == playerId)!

        type actionTypes = GetOpenedTrainCardAction |
            GetClosedTrainCardsAction |
            SubmitNewRoutesAction |
            GetNewRoutesAction |
            BuildRailPathAction |
            BuildStationAction

        const nextTurn = () => {
            if (playerId == publicState.lastPlayerId) {
                this.countPoints(publicState, privateState, settings.fieldType, statistics)
                const winner = getMaxElement(publicState.playersStates, ps => ps.points!)!
                gameState.publicState.winnersIds = [winner.playerId]
                game.status = GameStatusEnum.FINISHED
                return
            }
            publicState.activePlayerIndex = (publicState.activePlayerIndex + 1) % game.players.length
            statistics.turnCount++
            publicState.phase = TicketToRideGamePhase.PLAYER_TURN
            privateState.openedCardsGetCount = 0
        }

        const checkRoutes = () => {
            const routesToCheck = [...privatePlayerState.routes]
            removeElements(routesToCheck, privatePlayerState.finsishedRoutes)
            const newFinishedRoutes = this.getFinishedRoutes(settings.fieldType, publicState, playerId, routesToCheck)
            privatePlayerState.finsishedRoutes = distinct([...newFinishedRoutes, ...privatePlayerState.finsishedRoutes], id => id)
        }

        const handlers: MesasgeHandlers<actionTypes> = {
            GetOpenedTrainCardAction: (action: GetOpenedTrainCardAction) => {
                if (!isActivePlayerAction) {
                    return
                }

                if (privatePlayerState.routesToChoose.length > 0) {
                    gameContext.sendNotify(playerId, 'chooseRoutesFirst', {})
                    return
                }

                const openedCard = publicState.openedTrainCards[action.cardIndex]
                if (openedCard == TrainType.LOCOMOTIVE && privateState.openedCardsGetCount > 0) {
                    gameContext.sendNotify(playerId, 'youCantGetLocomotiveAsSecondCard', {})
                    return
                }
                privatePlayerState.trainCards[openedCard] = privatePlayerState.trainCards[openedCard] + 1
                publicState.openedTrainCards[action.cardIndex] = randomEnumVal(TrainType)

                const locomotiveCount = publicState.openedTrainCards.filter(card => card == TrainType.LOCOMOTIVE).length
                if (locomotiveCount >= maxOpenedLocomotives) {
                    publicState.openedTrainCards = this.randomTrainCards(opendedTrainCardsCount)
                    gameContext.sendNotify(undefined, 'tooMuchOpenedLocomotives', {})
                }

                privateState.openedCardsGetCount++
                if (openedCard == TrainType.LOCOMOTIVE || privateState.openedCardsGetCount >= 2) {
                    nextTurn()
                }
            },
            GetClosedTrainCardsAction: (action: GetClosedTrainCardsAction) => {
                if (!isActivePlayerAction) {
                    return
                }
                if (privatePlayerState.routesToChoose.length > 0) {
                    gameContext.sendNotify(playerId, 'chooseRoutesFirst', {})
                    return
                }
                if (privateState.openedCardsGetCount > 0) {
                    gameContext.sendNotify(playerId, 'chooseOpenedCard', {})
                    return
                }
                const newCards = this.randomTrainCards(closedCardGetCount)
                newCards.forEach(card => privatePlayerState.trainCards[card]++)
                nextTurn()
            },
            GetNewRoutesAction: (action: GetNewRoutesAction) => {
                if (!isActivePlayerAction) {
                    return
                }
                if (privateState.openedCardsGetCount > 0) {
                    gameContext.sendNotify(playerId, 'chooseOpenedCard', {})
                    return
                }
                if (privatePlayerState.routesToChoose.length > 0) {
                    gameContext.sendNotify(playerId, 'chooseRoutesFirst', {})
                    return
                }
                privatePlayerState.routesToChoose = privateState.routesDeck.splice(0, newRoutesCount)
                nextTurn()
            },
            SubmitNewRoutesAction: (action: SubmitNewRoutesAction) => {
                const routesToChoose = [...privatePlayerState.routesToChoose]
                removeElements(routesToChoose, action.routesIds)
                privatePlayerState.routes.push(...action.routesIds)
                privateState.routesDiscardPile.push(...routesToChoose)
                privatePlayerState.routesToChoose = []
                if (publicState.phase == TicketToRideGamePhase.CHOOSE_START_ROUTES && privateState.playersStates.every(ps => ps.routesToChoose.length == 0)) {
                    publicState.phase = TicketToRideGamePhase.PLAYER_TURN
                }
            },
            BuildRailPathAction: (action: BuildRailPathAction) => {
                if (!isActivePlayerAction) {
                    return
                }
                if (privateState.openedCardsGetCount > 0) {
                    gameContext.sendNotify(playerId, 'chooseOpenedCard', {})
                    return
                }
                if (privatePlayerState.routesToChoose.length > 0) {
                    gameContext.sendNotify(playerId, 'chooseRoutesFirst', {})
                    return
                }
                const playerTrainCards = privatePlayerState.trainCards
                const buildCards = action.buildCards
                const buildLocoCount = buildCards[TrainType.LOCOMOTIVE]

                if (!checkBuildCards(buildCards, playerTrainCards)) {
                    console.error('Invalid build cards')
                }

                const railPath = fieldData.railPaths.find(path => path.id == action.railPathId)
                if (!railPath) {
                    console.error(`No rail path with id "${action.railPathId}"`)
                    return
                }

                if (railPath.locomotiveCount > buildLocoCount) {
                    console.error('Invalid locomotive count')
                    return
                }
                const railLength = railPath.rects.length
                if (publicPlayerState.trains < railLength) {
                    console.error('Not enough trains')
                    return
                }

                if (getAllTrainCardsCount(buildCards) > railLength) {
                    console.error('Not enough train cards')
                    return
                }

                if (railPath.isTunnel) {
                    const tunnelCards = this.randomTrainCards(tunnelCardsCount)
                    tunnelCards.forEach(card => {
                        if (buildCards[card] > 0) {
                            buildCards[card]++
                        }
                    })
                    if (!checkBuildCards(buildCards, playerTrainCards)) {
                        gameContext.sendNotify(playerId, 'failedToBuildTunnel', {})
                        nextTurn()
                        return
                    }
                }

                substractTrainCards(playerTrainCards, buildCards)

                publicPlayerState.points += pointsByRailLength[railLength]
                publicState.buildedRailPaths.push({
                    id: railPath.id,
                    playerId: playerId
                })
                publicPlayerState.trains -= railLength

                let pathStats = playerStats.buildedPaths.find(paths => paths.length == railLength)
                if (!pathStats) {
                    pathStats = {
                        count: 1,
                        length: railLength
                    }
                    playerStats.buildedPaths.push(pathStats)
                } else {
                    pathStats.count++
                }
                checkRoutes()
                nextTurn()
                if (publicPlayerState.trains <= lastLoopTrainCount) {
                    publicState.lastPlayerId = playerId
                    gameContext.sendNotify(undefined, 'lastRound', {})
                }
            },
            BuildStationAction: (action: BuildStationAction) => {
                if (!isActivePlayerAction) {
                    return
                }
                if (privateState.openedCardsGetCount > 0) {
                    gameContext.sendNotify(playerId, 'chooseOpenedCard', {})
                    return
                }
                if (privatePlayerState.routesToChoose.length > 0) {
                    gameContext.sendNotify(playerId, 'chooseRoutesFirst', {})
                    return
                }
                const playerTrainCards = privatePlayerState.trainCards
                const buildCards = action.buildCards

                if (publicPlayerState.stations <= 0) {
                    return console.error('Not enough stations')
                }

                if (!checkBuildCards(buildCards, playerTrainCards)) {
                    console.error('Not enough train cards')
                    return
                }

                if (getRequiredStaionCardsCount(publicPlayerState) > getAllTrainCardsCount(action.buildCards)) {
                    console.error('Invalid build cards')
                    return
                }

                if (!fieldData.cities.find(city => city.id == action.cityId)) {
                    console.log(`No city with id "${action.cityId}"`)
                    return
                }

                if (!fieldData.railPaths.find(railPath => railPath.id == action.railPathId)) {
                    console.log(`No rail path with id "${action.railPathId}"`)
                    return
                }

                substractTrainCards(privatePlayerState.trainCards, action.buildCards)

                publicState.stations.push({
                    playerId: playerId,
                    cityId: action.cityId,
                    railPathId: action.railPathId
                })

                publicPlayerState.stations--
                checkRoutes()
                nextTurn()
            }
        }

        await handleMessage(handlers, gameAction)
    }

    cityGrpaphs: Map<TicketToRideFieldType, CityGraph> = new Map<TicketToRideFieldType, CityGraph>()

    getCityGraph(fieldType: TicketToRideFieldType): CityGraph {
        if (!this.cityGrpaphs.has(fieldType)) {
            const cityGraph = createCityGraph(fieldsDatas[fieldType])
            this.cityGrpaphs.set(fieldType, cityGraph)
        }
        return this.cityGrpaphs.get(fieldType)!
    }

    checkCityNode(cityNode: CityGraphNode, targetCityId: string, visitedNodesIds: Set<string>, playerRailsIds: Set<string>): boolean {
        visitedNodesIds.add(cityNode.cityId)
        if (cityNode.cityId == targetCityId) {
            return true
        }
        for (let [railId, subNode] of cityNode.rails.entries()) {
            if (visitedNodesIds.has(subNode.cityId) || !playerRailsIds.has(railId)) {
                continue
            }
            if (this.checkCityNode(subNode, targetCityId, visitedNodesIds, playerRailsIds)) {
                return true
            }
        }
        return false
    }

    checkRoute(cityGraph: CityGraph, route: Route, playerRailsIds: Set<string>): boolean {
        const startNode = cityGraph.get(route.from)
        if (!startNode) {
            throw new Error(`Invalid cityId "${route.from}"`)
        }
        const visitedNodesIds = new Set<string>()
        return this.checkCityNode(startNode, route.to, visitedNodesIds, playerRailsIds)
    }

    getFinishedRoutes(fieldType: TicketToRideFieldType, publicState: TicketToRidePublicGameState, playerId: string, routesToCheckIds: string[]): string[] {
        const field = fieldsDatas[fieldType]
        const cityGraph = this.getCityGraph(fieldType)
        const playerRailsIds = new Set<string>(publicState.buildedRailPaths.filter(path => path.playerId == playerId).map(path => path.id))
        publicState.stations.filter(station => station.playerId == playerId).forEach(station => playerRailsIds.add(station.railPathId))
        const routes = field.routes.filter(route => routesToCheckIds.includes(route.id))
        return routes.filter(route => {
            const routeFinished = this.checkRoute(cityGraph, route, playerRailsIds)
            console.log(`route finished ${route.id} = ${routeFinished}`)
            return routeFinished
        })
            .map(route => route.id)
    }

    async runBotsActions(botGameContext: BotGameContext): Promise<void> {
        return
    }
}
