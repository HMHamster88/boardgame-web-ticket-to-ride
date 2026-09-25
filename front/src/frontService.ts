import type { GameFrontService } from "boardgame-web-common/front";
import type { Component } from "vue";

import GameView from "./components/GameView.vue";
import PlayerComponent from "./components/PlayerComponent.vue";
import Settings from "./components/Settings.vue";
import StatisticsComponent from "./components/StatisticsComponent.vue";

export const gameType = "TICKET_TO_RIDE"

export class TicketToRideFrontService implements GameFrontService {
    canAddBot: boolean = false
    type: string = gameType
    settingsComponent: Component = Settings
    gameViewComponent: Component = GameView
    playerComponent: Component = PlayerComponent
    statisticsComponent: Component | undefined = StatisticsComponent
    localization: any = {
        en: {
            TICKET_TO_RIDE: 'Ticket to Ride',
            youCantGetLocomotiveAsSecondCard: 'You cant get locomotive as secondCard',
            tooMuchOpenedLocomotives: 'Three locomotives were drawn. Discard all cards.',
            chooseRoutesFirst: 'Choose routes first',
            chooseOpenedCard: 'Choose opened card',
            failedToBuildTunnel: 'Failed to build tunnel',
            lastRound: 'Last round'
        },
        ru: {
            TICKET_TO_RIDE: 'Билет на поезд',
            youCantGetLocomotiveAsSecondCard: 'Вы не можете брать локомотив второй картой',
            tooMuchOpenedLocomotives: 'Выпало три локомотива. Сброс всех карт.',
            chooseRoutesFirst: 'Сначала выберите маршруты',
            chooseOpenedCard: 'Выберите открытую карту',
            failedToBuildTunnel: 'Не получилось построить тунель',
            lastRound: 'Последний раунд'
        }
    }
    gameStaticSettings = {
        minPlayers: 2,
        maxPlayers: 6
    }

}