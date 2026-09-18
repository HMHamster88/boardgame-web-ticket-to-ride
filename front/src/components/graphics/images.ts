import { TicketToRideFieldType, TrainType } from 'ticket-to-ride-back'
import EUROPE from '../../assets/fields/EUROPE/EUROPE.webp'
import { europeRouteImages } from './europeRoutesImages'

import blackTrainCard from '../../assets/train-cards/black.webp'
import blueTrainCard from '../../assets/train-cards/blue.webp'
import greenTrainCard from '../../assets/train-cards/green.webp'
import locomotiveTrainCard from '../../assets/train-cards/locomotive.webp'
import orangeTrainCard from '../../assets/train-cards/orange.webp'
import purpleTrainCard from '../../assets/train-cards/purple.webp'
import redTrainCard from '../../assets/train-cards/red.webp'
import whiteTrainCard from '../../assets/train-cards/white.webp'
import yellowTrainCard from '../../assets/train-cards/yellow.webp'


export const fieldsImages: Record<TicketToRideFieldType, string> = {
    [TicketToRideFieldType.EUROPE]: EUROPE
}

export const routesImages: Record<TicketToRideFieldType, Record<string, string>> = {
    [TicketToRideFieldType.EUROPE]: europeRouteImages
}

export const trainCardsImages: Record<TrainType, string> = {
    [TrainType.BLACK]: blackTrainCard,
    [TrainType.BLUE]: blueTrainCard,
    [TrainType.GREEN]: greenTrainCard,
    [TrainType.LOCOMOTIVE]: locomotiveTrainCard,
    [TrainType.ORANGE]: orangeTrainCard,
    [TrainType.PURPLE]: purpleTrainCard,
    [TrainType.RED]: redTrainCard,
    [TrainType.WHITE]: whiteTrainCard,
    [TrainType.YELLOW]: yellowTrainCard
}