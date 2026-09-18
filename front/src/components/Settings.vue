<template>
    <div>
        <div class="settings-header">
            <o-field :label="t('fieldType')">
                <o-select id="type" v-model="settings.fieldType" :options="fieldTypes" />
            </o-field>
        </div>
        <img class="field-img" :src="fieldImage"></img>
    </div>
</template>

<script setup lang="ts">

import { OField, OSelect } from '@oruga-ui/oruga-next';

import type { GameAction } from 'boardgame-web-common';
import { TicketToRideFieldType, type TicketToRideGameSettings } from 'ticket-to-ride-back';
import { computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { fieldsImages } from './graphics/images';

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            fieldTypes: {
                EUROPE: 'Europe'
            },
            fieldType: 'Field Type:'
        },
        ru: {
            fieldTypes: {
                EUROPE: 'Европа'
            },
            fieldType: 'Тип Поля:'
        }
    }
})

const fieldTypes = Object.values(TicketToRideFieldType).filter(type => typeof type == 'string').map(type => {
    return { value: type, label: t('fieldTypes.' + type.toString()) }
})

const fieldImage = computed(() => {
    return fieldsImages[props.settings.fieldType]
})

const props = defineProps({
    settings: {
        type: Object as PropType<TicketToRideGameSettings>,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

</script>

<style>
.settings-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-img {
    margin: 0.5rem;
    max-height: 500px;
}
</style>