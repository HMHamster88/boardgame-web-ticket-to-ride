import type { TrainType } from "ticket-to-ride-back";

export interface SelectableTrainCard {
    type: TrainType
    selected: boolean
}