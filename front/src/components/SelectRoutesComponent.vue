<template>
    <div>
        <div class="flex justify-center mt-2">
            <div class="route-cards-container">
                <div v-for="route in routesToChoose" class="route-card container" v-on:click="cardClick(route)">
                    <img :src="filedRoutesImages[route]" class="route-card-image background-element"
                        :class="{ 'route-card-selected': selectedRoutesIds.includes(route) }">

                    </img>
                    <o-icon v-if="finishedRoutesIds?.includes(route)" class="overlay-element finished-route"
                        icon="check" variant="success" size="large"></o-icon>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { OIcon } from '@oruga-ui/oruga-next';
import { removeElement } from 'boardgame-web-common';
import type { TicketToRideFieldType } from 'ticket-to-ride-back';
import { computed, type PropType } from 'vue';
import { routesImages } from './graphics/images';

function cardClick(route: string) {
    if (props.selectedRoutesIds.includes(route)) {
        removeElement(props.selectedRoutesIds, route)
    } else {
        props.selectedRoutesIds.push(route)
    }
}

const filedRoutesImages = computed(() => routesImages[props.filedType])

const props = defineProps({
    filedType: {
        type: Object as PropType<TicketToRideFieldType>,
        required: true
    },
    routesToChoose: {
        type: Object as PropType<Array<string>>,
        required: true
    },
    selectedRoutesIds: {
        type: Object as PropType<Array<string>>,
        required: true
    },
    finishedRoutesIds: {
        type: Object as PropType<Array<string>>,
        required: false
    }
})

</script>

<style>
.route-cards-container {
    display: flex;
    overflow: auto;
    gap: 1rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
}

.route-card {
    border-radius: 8px;
    cursor: pointer;
}

.route-card-image {
    border-radius: 10px;
    border: 1px solid #8f8f8f;
    width: 6rem;
    max-width: 6rem;
}

.route-card-selected {
    border: 3px solid #37ff00;
}

.finished-route {
    -webkit-text-stroke: 1px black;
}
</style>