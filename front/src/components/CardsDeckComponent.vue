<template>
    <div>
        <div class="flex justify-center mt-2">
            <div class="cards-container">
                <img :src="routeCardBack" class="game-card-image" @click="emit('getNewRoutes')">
                </img>
                <img :src="trainCardBack" class="game-card-image" @click="emit('getClosedTrainCards')">
                </img>
                <img v-for="trainCard, index in openedTrainCards" class="game-card-image"
                    :src="trainCardsImages[trainCard]" @click="emit('getOpenedTrainCard', index)">
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TrainType } from 'ticket-to-ride-back';
import { type PropType } from 'vue';
import { trainCardsImages } from './graphics/images';

import routeCardBack from '../assets/route-back.webp';
import trainCardBack from '../assets/train-cards/train-back.webp';

const emit = defineEmits<{
    (e: 'getOpenedTrainCard', index: number): void,
    (e: 'getNewRoutes'): void,
    (e: 'getClosedTrainCards'): void
}>()

const props = defineProps({
    openedTrainCards: {
        type: Object as PropType<Array<TrainType>>,
        required: true
    }
})

</script>

<style>
.cards-container {
    display: flex;
    overflow: auto;
    gap: 1rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
}

.game-card-image {
    cursor: pointer;
    border-radius: 10px;
    border: 1px solid #8f8f8f;
    width: 6rem;
    max-width: 6rem;
}
</style>