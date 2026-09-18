<template>
    <div style="text-align: center;">{{ t('resources') + playerPublicState?.trains }}</div>
</template>

<script setup lang="ts">
import type { Player } from 'boardgame-web-common';
import type { TicketToRidePublicGameState } from 'ticket-to-ride-back';
import { computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';

let localization: any = {
    en: {
        resources: 'Trains: '
    },
    ru: {
        resources: 'Вогоны: '
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

const playerPublicState = computed(() => {
    return props.gameState.playersStates.find(pl => pl.playerId == props.player.userId)
})

const props = defineProps({
    player: {
        type: Object as PropType<Player>,
        required: true
    },
    gameState: {
        type: Object as PropType<TicketToRidePublicGameState>,
        required: true
    }
})
</script>