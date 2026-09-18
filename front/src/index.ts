import { TicketToRideFrontService } from './frontService'

export const catanGameType = "CATAN"


export function getGameFrontService() {
    return new TicketToRideFrontService()
}