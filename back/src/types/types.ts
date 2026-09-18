import { type GamePrivateState, type GamePublicState, type GameSettings, type GameStatistics, type PlayerPrivateState, type PlayerPublicState } from "boardgame-web-common/back";
import { RailColor } from "../fields/fieldData";

export interface Size {
    width: number,
    height: number
}

export enum TrainType {
    BLACK = 'BLACK',
    BLUE = 'BLUE',
    GREEN = 'GREEN',
    ORANGE = 'ORANGE',
    PURPLE = 'PURPLE',
    RED = 'RED',
    WHITE = 'WHITE',
    YELLOW = 'YELLOW',
    LOCOMOTIVE = 'LOCOMOTIVE'
}

export function trainTypeFromRailColor(railColor: RailColor) {
    if (railColor == RailColor.GRAY) {
        return undefined
    }
    return railColor as unknown as TrainType
}

export enum TicketToRideFieldType {
    EUROPE = 'EUROPE',
}

export enum TicketToRideGamePhase {
    CHOOSE_START_ROUTES = 'CHOOSE_START_ROUTES',
    PLAYER_TURN = 'PLAYER_TURN',
}

export interface TicketToRideGameSettings extends GameSettings {
    fieldType: TicketToRideFieldType
}

export interface TicketToRidePlayerPublicState extends PlayerPublicState {
    cardsCount: number
    trains: number
    stations: number
}

export interface BuiledPathStats {
    length: number,
    count: number
}

export interface RouteStatistics {
    routeId: string,
    points: number
}

export interface PlayerStatistics {
    playerId: string
    routeStatistics: RouteStatistics[]
    buildedPaths: BuiledPathStats[]
    stations: number
    longestPath: boolean
}

export interface TicketToRideGameStatistics extends GameStatistics {
    playersStatistics: PlayerStatistics[]
}

export interface RailPath {
    id: string
    playerId: string
}

export interface Station {
    cityId: string
    playerId: string
    railPathId: string
}

export interface TicketToRidePublicGameState extends GamePublicState {
    phase: TicketToRideGamePhase
    playersStates: TicketToRidePlayerPublicState[]
    openedTrainCards: TrainType[]
    buildedRailPaths: RailPath[]
    stations: Station[]
    lastPlayerId: string | undefined
    longestPath: LongestPath | undefined
}

export type TrainCards = Record<TrainType, number>

export interface TicketToRidePlayerPrivateState extends PlayerPrivateState {
    trainCards: TrainCards,
    routesToChoose: string[]
    routes: string[]
    finsishedRoutes: string[]
}

export interface TicketToRidePrivateGameState extends GamePrivateState {
    playersStates: TicketToRidePlayerPrivateState[]
    routesDeck: string[]
    routesDiscardPile: string[]
    openedCardsGetCount: 0
}

export interface CityGraphNode {
    cityId: string
    rails: Map<string, CityGraphNode>
}

export type CityGraph = Map<string, CityGraphNode>

export interface LongestPath {
    playerId: string,
    pathIds: string[]
}

export const pointsByRailLength: Record<number, number> = {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    6: 15,
    8: 21
}

export const stationPoints = 4
export const longestPathPoints = 10