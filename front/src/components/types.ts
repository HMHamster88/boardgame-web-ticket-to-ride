import type { PlayerGameSettings } from "boardgame-web-common/front";
import type { TrainType } from "ticket-to-ride-back";

export interface SelectableTrainCard {
    type: TrainType
    selected: boolean
}

export interface TicketToRidePlayerGameSettings extends PlayerGameSettings {
    showLinesForSelectedRoute: boolean
    showCitiesForSelectedRoute: boolean
}