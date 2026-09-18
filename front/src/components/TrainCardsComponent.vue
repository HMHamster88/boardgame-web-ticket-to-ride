<template>
    <div>
        <div class="flex justify-center mt-2">
            <div class="train-cards-container">
                <div v-for="card, index in flatCards" class="train-card" @click="cardClick(index)"
                    :class="{ 'train-card-selected': model.has(index) }">
                    <img :src="trainCardsImages[card]" class="train-card-image">

                    </img>
                </div>
            </div>

        </div>
        <div class="flex justify-center gap-3">
            <div class="flex overflow-auto gap-2 items-center">
                <div v-for="[trainType, trainCount] in recordEntries(cards)" class="flex items-center container">
                    <img class="card-icon background-element" :src="trainCardsImages[trainType]"></img>
                    <span class="icon-text overlay-element">{{ trainCount }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { recordEntries } from 'boardgame-web-common';
import { TrainType, type TrainCards } from 'ticket-to-ride-back';
import { type PropType } from 'vue';
import { trainCardsImages } from './graphics/images';

const model = defineModel<Set<number>>({ required: true })

function cardClick(index: number) {
    if (model.value.has(index)) {
        model.value.delete(index)
    } else {
        model.value.add(index)
    }
}

const props = defineProps({
    cards: {
        type: Object as PropType<TrainCards>,
        required: true
    },
    flatCards: {
        type: Object as PropType<Array<TrainType>>,
        required: true
    }
})

</script>

<style>
.train-cards-container {
    display: flex;
    overflow: auto;
    gap: 1rem;
    padding-bottom: 1rem;
    padding-top: 2rem;
}

.train-cards-container .train-card:not(:first-child) {
    margin-left: -4rem;
}

.train-card {
    border-radius: 8px;
    cursor: pointer;
}

.train-card-image {
    border-radius: 10px;
    border: 1px solid #303030;
    width: 6rem;
    max-width: 6rem;
}

.train-card-selected {
    margin-top: -2rem;
}

.card-icon {
    width: 2rem;
    max-width: 2rem;
    border-radius: 4px;
}

.icon-text {
    font-size: 24px;
    font-weight: bold;
    color: white;
    -webkit-text-stroke: 1px black;
}

.container {
    display: grid;
    place-items: center;
    /* Centers the content horizontally and vertically */
}

.background-element,
.overlay-element {
    grid-area: 1 / 1;
    /* Forces both elements into the exact same first row and column */
}

.overlay-element {
    z-index: 1;
    /* Ensures the overlay stays visibly on top */
}
</style>