<template>
    <div>
        <o-field>
                <o-switch :label="t('showLinesForSelectedRoute')" v-model="settings.showLinesForSelectedRoute" />
        </o-field>
        <o-field>
                <o-switch :label="t('showCitiesForSelectedRoute')" v-model="settings.showCitiesForSelectedRoute" />
        </o-field>
    </div>
</template>

<script setup lang="ts">
import { OField, OSwitch } from '@oruga-ui/oruga-next';
import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { type TicketToRidePlayerGameSettings } from './types'

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            showLinesForSelectedRoute: 'Show Lines For Selected Route',
            showCitiesForSelectedRoute: 'Show Cities For SelectedRoute'
        },
        ru: {
            showLinesForSelectedRoute: 'Показывать Линии Для Выделенных Маршрутов',
            showCitiesForSelectedRoute: 'Показывать Города Для Выделенных Маршрутов'
        }
    }
})

const props = defineProps({
    settings: {
        type: Object as PropType<TicketToRidePlayerGameSettings>,
        required: true
    },
})
</script>