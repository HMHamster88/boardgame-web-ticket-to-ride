import type { GameAction } from "boardgame-web-common/back";
import type { TrainCards } from "./types";

export interface SubmitNewRoutesAction extends GameAction {
    type: 'SubmitNewRoutesAction'
    routesIds: string[]
}

export interface GetOpenedTrainCardAction extends GameAction {
    type: 'GetOpenedTrainCardAction'
    cardIndex: number
}

export interface GetClosedTrainCardsAction extends GameAction {
    type: 'GetClosedTrainCardsAction'
}

export interface GetNewRoutesAction extends GameAction {
    type: 'GetNewRoutesAction'
}

export interface BuildRailPathAction extends GameAction {
    type: 'BuildRailPathAction'
    railPathId: string
    buildCards: TrainCards
}

export interface BuildStationAction extends GameAction {
    type: 'BuildStationAction'
    cityId: string
    railPathId: string
    buildCards: TrainCards
}