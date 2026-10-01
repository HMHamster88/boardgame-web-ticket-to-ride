<template>
    <div>
        <div class="flex justify-center mt-2">
            <div class="cards-container">
                <img :src="routeCardBack" class="game-card-image" @click="emit('getNewRoutes')">
                </img>
                <img :src="trainCardBack" class="game-card-image" @click="emit('getClosedTrainCards')">
                </img>
                <div v-for="trainCard, index in animatedOpenedCards" class="flip-card">
                    <div class="flip-card-inner" :class="flippedTrainCardIndex == index ? 'flipped-card' : ''">
                        <div class="flip-card-front">
                        <img :src="trainCardsImages[trainCard]" @click="clickOpenedCard(index)" class="game-card-image">
                        </div>
                        <div class="flip-card-back">
                        <img :src="trainCardBack" class="game-card-image">
                        </img>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { TrainType } from 'ticket-to-ride-back';
import { onMounted, ref, watch, type PropType } from 'vue';
import { trainCardsImages } from './graphics/images';

import routeCardBack from '../assets/route-back.webp';
import trainCardBack from '../assets/train-cards/train-back.webp';

const emit = defineEmits<{
    (e: 'getNewRoutes'): void,
    (e: 'getClosedTrainCards'): void
}>()

const animatedOpenedCards = ref<TrainType[]>()

const flippedTrainCardIndex = ref<Number>()

const flipAnimationLength = 400

async function clickOpenedCard(index: number) {
    if (!props.canGetOpenedTrainCard) {
        return
    }
    flippedTrainCardIndex.value = index
    await props.getOpenedTrainCard(index)
    window.setTimeout(() => {
        flippedTrainCardIndex.value = undefined
    }, flipAnimationLength)
}

const props = defineProps({
    openedTrainCards: {
        type: Object as PropType<Array<TrainType>>,
        required: true
    },
    getOpenedTrainCard: {
        type: Function as PropType<(index: number) => Promise<void>>,
        required: true
    },
    canGetOpenedTrainCard: {
        type: Boolean,
        required: true
    }
})

watch(props.openedTrainCards, newValue => {
    window.setTimeout(() => {
        animatedOpenedCards.value = [...newValue]
    }, flipAnimationLength)
})

onMounted(() => {
    animatedOpenedCards.value = [...props.openedTrainCards]
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

.flip-card {
  background-color: transparent;
  width: 6rem;
  max-width: 6rem;
  perspective: 1000px; /* Remove this if you don't want the 3D effect */
}

/* This container is needed to position the front and back side */
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.4s;
  transform-style: preserve-3d;
}

.flipped-card {
    transform: rotateY(180deg);
}

/* Position the front and back side */
.flip-card-front, .flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden; /* Safari */
  backface-visibility: hidden;
}

/* Style the front side (fallback if image is missing) */
.flip-card-front {
}

/* Style the back side */
.flip-card-back {
  transform: rotateY(180deg);
}
</style>