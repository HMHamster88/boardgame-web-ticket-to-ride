
import type { GameBackService } from 'boardgame-web-common/back'
import { TicketToRideGameBackService } from './ticketToRideBackService'
export * from './fields/fieldData'
export * from './ticketToRideBackService'
export * from './types/actions'
export * from './types/types'
export * from './utils'


export function getGameBackService(): GameBackService {
    return new TicketToRideGameBackService()
}