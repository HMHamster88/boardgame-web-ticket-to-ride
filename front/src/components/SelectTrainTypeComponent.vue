<template>
    <div class="flex justify-center gap-3">
        <div class="flex overflow-auto gap-2 items-center">
            <div v-for="trainType in possibleTrainTypes" class="flex items-center container"
                @click="selectTrainType(trainType)">
                <img class="card-icon background-element" :src="trainCardsImages[trainType]"
                    :class="{ 'route-card-selected': selected == trainType }"></img>
                <span class="icon-text overlay-element">{{ availbleTrainCards[trainType] }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TrainCards, TrainType } from 'ticket-to-ride-back';
import { type PropType } from 'vue';
import { trainCardsImages } from './graphics/images';

const selected = defineModel<TrainType>();

function selectTrainType(trainType: TrainType) {
    selected.value = trainType
}

const props = defineProps({
    availbleTrainCards: {
        type: Object as PropType<TrainCards>,
        required: true
    },
    possibleTrainTypes: {
        type: Object as PropType<TrainType[]>,
        required: false
    }
})

</script>