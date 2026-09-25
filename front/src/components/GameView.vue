<template>
    <CardsDeckComponent :openedTrainCards="gameState.openedTrainCards" v-on:get-closed-train-cards="getClosedTrainCards"
        v-on:get-new-routes="getNewRoutes" v-on:get-opened-train-card="getOpenedTrainCard">

    </CardsDeckComponent>

    <svg preserveAspectRatio="xMidYMid meet" :viewBox="`${0} ${0} ${gameField.size.width} ${gameField.size.height}`"
        class="field" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <image :height="gameField.size.height" :width="gameField.size.width" x="0" y="0"
            xmlns:xlink="http://www.w3.org/1999/xlink" :xlink:href="gameFieldImage" />

        <line v-for="route in selectedRoutesWithCoords" :x1="route.fromCoords.x" :y1="route.fromCoords.y"
            :x2="route.toCoords.x" :y2="route.toCoords.y" class="selected-route-line"
            vector-effect="non-scaling-stroke">
        </line>
        <circle v-for="city in citiesWithRailPaths" @click="cityClick(city)" :class="cityClass(city)"
            :style="cityStyle(city)" :id="city.id" :cx="city.cx" :cy="city.cy" :r="gameField.cityRadius" />
        <g v-for="railPath in gameField.railPaths" :id="railPath.id" @click="railPathClick(railPath)" class="rail-path"
            :style="railPathStyle(railPath)" :class="railPathClass(railPath)">
            <rect v-for="rect in railPath.rects" :x="rect.x" :y="rect.y" :width="gameField.rectSize.width"
                :height="gameField.rectSize.height" :transform="rect.transform" :rx="gameField.rectSize.height / 4"
                :ry="gameField.rectSize.height / 4" vector-effect="non-scaling-stroke">
            </rect>

            <rect v-if="isLongestRailPath(railPath)" v-for="rect in railPath.rects" :x="rect.x" :y="rect.y"
                :width="gameField.rectSize.width" :height="gameField.rectSize.height" :transform="rect.transform"
                :rx="gameField.rectSize.height / 4" filter="invert(100%)" fill="none" stroke-dasharray="4"
                :ry="gameField.rectSize.height / 4" vector-effect="non-scaling-stroke">
            </rect>
        </g>

    </svg>
    <div v-if="selectedCity && selectedRailPath" class="flex justify-center gap-1">
        <span style="align-content: center;">{{ t('buildStation') }}</span>
        <o-button :disabled="!canSubmitStation" @click="buildStation()">{{ t('submit') }}</o-button>
        <o-button @click="cancelStationBuild()">{{ t('cancel') }}</o-button>
    </div>
    <div v-else-if="selectedCity" class="flex justify-center gap-1">
        <span style="align-content: center;">{{ t('selectRailPath') }}</span>
        <o-button @click="cancelStationBuild()">{{ t('cancel') }}</o-button>
    </div>
    <div v-else-if="selectedRailPath" class="flex justify-center gap-1">
        <span style="align-content: center;">{{ t('railpathBuild') }}</span>
        <o-button @click="buildRailPath()" :disabled="!canBuildRail">{{ t('submit') }}</o-button>
        <o-button @click="cancelRailPathBuild()">{{ t('cancel') }}</o-button>
    </div>
    <div v-else class="flex justify-center">{{ status }}</div>
    <div v-if="playerPrivateState && playerPrivateState.routesToChoose.length > 0" class="flex flex-col justify-center">
        <SelectRoutesComponent :routesToChoose="playerPrivateState.routesToChoose" :filedType="gameSettings.fieldType"
            :selectedRoutesIds="selectedRoutesIds">

        </SelectRoutesComponent>
        <o-button @click="submitSelectedRoutes()" :disabled="!canSubmitnewRoutes">{{ t('submit') }}</o-button>
    </div>
    <div v-if="publicPlayerState" class="flex justify-center">
        {{ t('trains') + ': ' + publicPlayerState.trains }} {{ t('stations') + ': ' + publicPlayerState.stations }}
    </div>
    <TrainCardsComponent v-if="playerPrivateState" :cards="playerPrivateState.trainCards"
        v-model="selectedTrainCardsIndeces" :flat-cards="flatCards">
    </TrainCardsComponent>
    <div v-if="playerPrivateState && playerPrivateState.routes.length > 0" class="flex flex-col justify-center">
        <SelectRoutesComponent :routesToChoose="playerPrivateState.routes" :filedType="gameSettings.fieldType"
            :selectedRoutesIds="selectedRoutesIds" :finished-routes-ids="playerPrivateState.finsishedRoutes">
        </SelectRoutesComponent>
    </div>
</template>

<script setup lang="ts">

import {
    addToMapArray,
    GameStatusEnum,
    initEnumRecord,
    rangeArray,
    recordEntries,
    toMap,
    toStringIdMap,
    type Game,
    type GameAction,
    type Player,
    type Vector2DLike
} from 'boardgame-web-common';
import {
    fieldsDatas,
    getColorTrainTypesCount,
    TicketToRideGamePhase,
    TrainType,
    trainTypeFromRailColor,
    type BuildRailPathAction,
    type BuildStationAction,
    type CityData,
    type GetClosedTrainCardsAction,
    type GetNewRoutesAction,
    type GetOpenedTrainCardAction,
    type RailPath,
    type RailPathData,
    type Route,
    type SubmitNewRoutesAction,
    type TicketToRideGameSettings,
    type TicketToRidePlayerPrivateState,
    type TicketToRidePublicGameState,
    type TrainCards
} from 'ticket-to-ride-back';

import { OButton, useOruga } from '@oruga-ui/oruga-next';
import { computed, ref, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import CardsDeckComponent from './CardsDeckComponent.vue';
import { fieldsImages } from './graphics/images.ts';
import SelectRoutesComponent from './SelectRoutesComponent.vue';
import TrainCardsComponent from './TrainCardsComponent.vue';

const oruga = useOruga();

const { t } = useI18n({
    locale: 'en',
    messages: {
        en: {
            chooseStartRoutes: 'Choose at least two new routes',
            chooseRoutes: 'Choose at least one new route',
            playersChooseRoutes: 'Players choose routes',
            notEnoughTrainCards: 'Not enough train cards',
            notEnoughTrains: 'Not enough trains',
            getNewRoutesQuestion: 'Get new routes?',
            railpathBuild: 'Rail path build',
            selectRailPath: 'Select rail path',
            buildStation: 'Build station',
            stations: 'Stations',
            trains: 'Trains',
            status: {
                localPlayer: {
                    PLAYER_TURN: 'Your turn',
                },
                notLocalPlayer: {
                    PLAYER_TURN: '{player} turn',
                }
            }
        },
        ru: {
            chooseStartRoutes: 'Выберите как минимум два новых маршрута',
            chooseRoutes: 'Выберите как минимум оди новый маршрут',
            playersChooseRoutes: 'Игроки выбирают маршруты',
            notEnoughTrainCards: 'Недостаточно карт составов',
            notEnoughTrains: 'Недостаточно вагонов',
            getNewRoutesQuestion: 'Взять новый маршрут?',
            railpathBuild: 'Построить перегон',
            selectRailPath: 'Выберите путь',
            buildStation: 'Построить станцию',
            stations: 'Стнации',
            trains: 'Вагоны',
            status: {
                localPlayer: {
                    PLAYER_TURN: 'Ваш ход',
                },
                notLocalPlayer: {
                    PLAYER_TURN: '{player} ходит',
                }
            }
        }
    }
})

function getOpenedTrainCard(index: number) {
    if (!isLocalPlayerTurn.value) {
        return
    }
    performAction<GetOpenedTrainCardAction>({
        type: 'GetOpenedTrainCardAction',
        cardIndex: index
    })
}

async function getNewRoutes() {
    if (!isLocalPlayerTurn.value) {
        return
    }
    const result = await oruga.dialog.open({
        title: t('getNewRoutesQuestion'),
        content: t('getNewRoutesQuestion'),
        confirmButton: t('ok'),
        confirmVariant: "success",
        cancelButton: t('cancel'),
        buttonPosition: "right",
        closeOnConfirm: true
    }).promise
    if (result[1] == 'confirm') {
        performAction<GetNewRoutesAction>({
            type: 'GetNewRoutesAction'
        })
    }


}

function getClosedTrainCards() {
    if (!isLocalPlayerTurn.value) {
        return
    }
    performAction<GetClosedTrainCardsAction>({
        type: 'GetClosedTrainCardsAction'
    })
}

function submitSelectedRoutes() {
    console.log('submitSelectedRoutes')
    performAction<SubmitNewRoutesAction>({
        type: 'SubmitNewRoutesAction',
        routesIds: selectedRoutesIds.value
    })
}

const flatCards = computed<TrainType[]>(() => {
    if (!props.playerPrivateState) {
        return []
    }
    return recordEntries(props.playerPrivateState.trainCards)
        .flatMap(([trainType, trainCount]) => rangeArray(trainCount).map(() => trainType))
})

const selectedTrainCardsIndeces = ref<Set<number>>(new Set<number>())

const selectedTrainCards = computed(() => {
    const result = initEnumRecord<TrainType, number>(TrainType, {}, 0)
    flatCards.value.forEach((type, index) => {
        if (selectedTrainCardsIndeces.value.has(index)) {
            result[type]++
        }
    })
    return result
})

const selectedRailPath = ref<RailPathData>()
const selectedRoutesIds = ref<string[]>([])
const selectedRoutes = computed(() => gameField.value.routes.filter(route => selectedRoutesIds.value.includes(route.id)))

const selectedCity = ref<CityWithRailPaths>()

const canSubmitnewRoutes = computed(() => {
    if (props.gameState.phase == TicketToRideGamePhase.CHOOSE_START_ROUTES) {
        return selectedRoutesIds.value.length >= 2
    }
    return selectedRoutesIds.value.length >= 1
})

interface RouteWithCoords extends Route {
    fromCoords: Vector2DLike
    toCoords: Vector2DLike
}

const selectedRoutesWithCoords = computed(() => {
    return selectedRoutes.value.map(route => {
        const routeWithCoords: RouteWithCoords = {
            ...route,
            fromCoords: getCytiPosById(route.from),
            toCoords: getCytiPosById(route.to),
        }
        return routeWithCoords
    })
})

function getCytiPosById(cityId: string): Vector2DLike {
    const city = citiesById.value.get(cityId)
    if (!city) {
        throw new Error(`No city with id ${cityId}`)
    }
    return {
        x: city.cx,
        y: city.cy
    }
}

const buildedRailPathById = computed(() => {
    return toStringIdMap(props.gameState.buildedRailPaths)
})

const playerById = computed(() => {
    return new Map<string, Player>(
        props.game.players.map(player => [player.userId, player])
    );
})

function isLongestRailPath(railPath: RailPathData) {
    return props.gameState.longestPath && props.gameState.longestPath.pathIds.includes(railPath.id)
}

function railPathStyle(railPath: RailPathData) {
    const buildedPath = buildedRailPathById.value.get(railPath.id)
    let result = ''
    if (buildedPath) {
        const player = playerById.value.get(buildedPath.playerId)
        if (!player) {
            return result
        }
        result = result + `fill: ${player.color}; `
        const station = stationsByRailPathId.value.get(railPath.id)
        if (station) {
            const stationPlayer = playerById.value.get(station.playerId)
            if (stationPlayer) {
                result = result + `stroke: ${stationPlayer.color}; `
            }
        }
    }
    if (isLongestRailPath(railPath)) {
        const player = playerById.value.get(props.gameState.longestPath?.playerId!)
        if (player) {
            result = result + `stroke: ${player.color}; `
        }
    }
    return result
}

/*function railPathFilter(railPath: RailPathData) {
    return longestPathPlayer(railPath) ? 'invert(100%)' : undefined
}*/

function railPathClass(railPath: RailPathData) {
    return {
        'selected-rail-path': railPath.id == selectedRailPath.value?.id
    }
}

interface CityWithRailPaths extends CityData {
    railPaths: RailPathData[]
}

const citiesWithRailPaths = computed<CityWithRailPaths[]>(() => {
    const pathsByCityId = new Map<string, RailPathData[]>()
    gameField.value.railPaths.forEach(path => {
        addToMapArray(path.from, path, pathsByCityId)
        addToMapArray(path.to, path, pathsByCityId)
    })
    return gameField.value.cities.map(city => {
        const cityWithPaths: CityWithRailPaths = {
            ...city,
            railPaths: pathsByCityId.get(city.id)!
        }
        return cityWithPaths
    })
})

const citiesById = computed(() => {
    return toStringIdMap(citiesWithRailPaths.value)
})

const selectedCitiesIds = computed(() => {
    return selectedRoutes.value.flatMap(route => [route.from, route.to])
})

const gameField = computed(() => {
    return fieldsDatas[props.gameSettings.fieldType]
})

const gameFieldImage = computed(() => {
    return fieldsImages[props.gameSettings.fieldType]
})

function checkCanBuildRailPath(railPath: RailPathData) {
    if (!props.playerPrivateState) {
        return false
    }
    const availableCards = props.playerPrivateState.trainCards
    if (availableCards.LOCOMOTIVE < railPath.locomotiveCount) {
        return false
    }
    const remainingLoco = availableCards.LOCOMOTIVE - railPath.locomotiveCount
    const railLength = railPath.rects.length
    const railLengthWithoutLoco = railLength - railPath.locomotiveCount
    const trainType = trainTypeFromRailColor(railPath.color)
    if (!trainType) {
        const maxResources = Math.max(...recordEntries(availableCards).map(([_type, count]) => count))
        return railLengthWithoutLoco <= maxResources + remainingLoco
    }
    return railLengthWithoutLoco <= availableCards[trainType] + remainingLoco
}

function getMaxColorCards(trainCards: TrainCards): [TrainType, number] {
    return recordEntries(trainCards)
        .filter(([type, _count]) => type != TrainType.LOCOMOTIVE)
        .reduce((max, trains) =>
            trains[1] > max[1] ? trains : max
        )
}

async function railPathClick(railPath: RailPathData) {
    if (!isLocalPlayerTurn.value || !publicPlayerState.value || !props.playerPrivateState) {
        return
    }
    if (buildedRailPathById.value.has(railPath.id)) {
        if (selectedCity.value) {
            const buildedPaths = getCityOtherPlayerBuildedPaths(selectedCity.value)
            if (buildedPaths.some(path => path.id == railPath.id)) {
                selectedRailPath.value = railPath
                return
            }
        }
        return
    }
    if (publicPlayerState.value.trains < railPath.rects.length) {
        oruga.notification.open({
            duration: 1000,
            message: t('notEnoughTrains')
        });
        return
    }
    if (!checkCanBuildRailPath(railPath)) {
        oruga.notification.open({
            duration: 1000,
            message: t('notEnoughTrainCards')
        });
        return
    }
    selectedRailPath.value = railPath
    const availableCards = props.playerPrivateState.trainCards
    selectedTrainCardsIndeces.value.clear()
    let trainType = trainTypeFromRailColor(railPath.color)
    if (!trainType) {
        trainType = getMaxColorCards(availableCards)[0];
    }
    const railLength = railPath.rects.length
    let locomotiveCount = railPath.locomotiveCount
    const availableColorTrains = availableCards[trainType]
    if (locomotiveCount + availableColorTrains >= railLength) {
        selectTrainCards(trainType, railLength - locomotiveCount)
    } else {
        locomotiveCount = railLength - availableColorTrains
        selectTrainCards(trainType, availableColorTrains)
    }
    selectTrainCards(TrainType.LOCOMOTIVE, locomotiveCount)
}

function buildRailPath() {
    if (!canBuildRail.value) {
        return
    }

    performAction<BuildRailPathAction>({
        type: 'BuildRailPathAction',
        railPathId: selectedRailPath.value?.id!,
        buildCards: selectedTrainCards.value
    })

    selectedTrainCardsIndeces.value.clear()
    selectedRailPath.value = undefined
}

function selectTrainCards(trainType: TrainType, count: number) {
    for (let [index, type] of flatCards.value.entries()) {
        if (type == trainType) {
            selectedTrainCardsIndeces.value.add(index)
            count--
        }
        if (count <= 0) {
            return
        }
    }
}


const canBuildRail = computed(() => {
    if (!props.playerPrivateState || !selectedRailPath.value) {
        return false
    }

    const railPath = selectedRailPath.value
    const trainType = trainTypeFromRailColor(railPath.color)
    if (trainType) {
        const invalidColorTrain = recordEntries(selectedTrainCards.value)
            .find(([type, count]) => type != trainType && type != TrainType.LOCOMOTIVE && count > 0)
        if (invalidColorTrain) {
            return false
        }
    }
    const selectedColorTypesCount = getColorTrainTypesCount(selectedTrainCards.value)
    if (selectedColorTypesCount > 1) {
        return false
    }
    const allCardsCount = Object.values(selectedTrainCards.value).reduce((a, c) => a + c, 0)
    if (allCardsCount != railPath.rects.length) {
        return false
    }
    return true
})

function cancelRailPathBuild() {
    selectedRailPath.value = undefined
}

const stationsByCityId = computed(() => {
    return toMap(props.gameState.stations, station => station.cityId)
})

const stationsByRailPathId = computed(() => {
    return toMap(props.gameState.stations, station => station.railPathId)
})

function getCityOtherPlayerBuildedPaths(city: CityWithRailPaths): RailPath[] {
    if (!localPlayer.value) {
        return []
    }
    return city.railPaths.map(path => buildedRailPathById.value.get(path.id))
        .filter(path => path != undefined)
        .filter(path => path.playerId != localPlayer.value?.userId)
}

function getRequiredStaionCardsCount(playerStationCount: number) {
    return 4 - playerStationCount
}

function cityClick(city: CityWithRailPaths) {
    if (!isLocalPlayerTurn.value || localPlayer.value === undefined || props.playerPrivateState == undefined) {
        return
    }
    if (!publicPlayerState.value || publicPlayerState.value.stations <= 0) {
        return
    }
    if (stationsByCityId.value.has(city.id)) {
        return
    }
    const buildedPaths = getCityOtherPlayerBuildedPaths(city)
    if (buildedPaths.length <= 0) {
        return
    }
    const requiredCards = getRequiredStaionCardsCount(publicPlayerState.value.stations)
    const maxColorCards = getMaxColorCards(props.playerPrivateState?.trainCards)

    const availableColorTrains = maxColorCards[1]
    if (availableColorTrains >= requiredCards) {
        selectTrainCards(maxColorCards[0], requiredCards)
    } else {
        const availableLocoCount = props.playerPrivateState?.trainCards[TrainType.LOCOMOTIVE]
        if (availableColorTrains + availableLocoCount < requiredCards) {
            oruga.notification.open({
                duration: 1000,
                message: t('notEnoughTrainCards')
            });
            return
        }
        const locomotiveCount = requiredCards - availableColorTrains
        selectTrainCards(maxColorCards[0], availableColorTrains)
        selectTrainCards(TrainType.LOCOMOTIVE, locomotiveCount)
    }
    selectedCity.value = city
}

const canSubmitStation = computed(() => {
    if (!props.playerPrivateState || !selectedRailPath.value || !selectedCity.value || !publicPlayerState.value) {
        return false
    }
    const selectedColorTypesCount = getColorTrainTypesCount(selectedTrainCards.value)
    if (selectedColorTypesCount > 1) {
        return false
    }
    const requiredCards = getRequiredStaionCardsCount(publicPlayerState.value.stations)
    const allCardsCount = Object.values(selectedTrainCards.value).reduce((a, c) => a + c, 0)
    if (allCardsCount != requiredCards) {
        return false
    }
    return true
})

function cancelStationBuild() {
    selectedCity.value = undefined
    selectedRailPath.value = undefined
}

function buildStation() {
    if (!canSubmitStation.value) {
        return
    }
    performAction<BuildStationAction>({
        type: 'BuildStationAction',
        cityId: selectedCity.value?.id!,
        railPathId: selectedRailPath.value?.id!,
        buildCards: selectedTrainCards.value
    })
    selectedCity.value = undefined
    selectedRailPath.value = undefined
}

function cityClass(city: CityData) {
    return {
        'city': true,
        'route-selected-city': selectedCitiesIds.value.includes(city.id),
        'selected-city': city.id == selectedCity.value?.id
    }
}

function cityStyle(city: CityData) {
    const buildedStation = stationsByCityId.value.get(city.id)
    if (buildedStation) {
        const player = playerById.value.get(buildedStation.playerId)
        if (!player) {
            return ''
        }
        return `fill: ${player.color}`
    }
    return ''
}

const status = computed(() => {
    if (props.game.status == GameStatusEnum.FINISHED) {
        return t('gameFinished')
    }
    const phase = props.gameState.phase
    if (phase == TicketToRideGamePhase.CHOOSE_START_ROUTES) {
        if (props.playerPrivateState && props.playerPrivateState.routesToChoose.length > 0) {
            return t('chooseStartRoutes')
        } else {
            return t('playersChooseRoutes')
        }
    }
    if (props.playerPrivateState && props.playerPrivateState.routesToChoose.length > 0) {
        return t('chooseRoutes')
    }
    const playerPart = isLocalPlayerTurn.value ? 'localPlayer' : 'notLocalPlayer'
    return t(`status.${playerPart}.${phase}`, { player: props.game.players[props.gameState.activePlayerIndex]?.name })
})

const localPlayer = computed(() => {
    if (props.localPlayerIndex == undefined) {
        return undefined
    }
    return props.game.players[props.localPlayerIndex]!
})


const isLocalPlayerTurn = computed(() => {
    return props.localPlayerIndex == props.gameState.activePlayerIndex
})


const publicPlayerState = computed(() => {
    if (props.localPlayerIndex === undefined) {
        return undefined
    }
    return props.gameState.playersStates[props.localPlayerIndex]
})

function performAction<T extends GameAction>(action: T) {
    console.log('performAction')
    emit('performAction', action)
}

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()

const props = defineProps({
    game: {
        type: Object as PropType<Game>,
        required: true
    },
    gameSettings: {
        type: Object as PropType<TicketToRideGameSettings>,
        required: true
    },
    gameState: {
        type: Object as PropType<TicketToRidePublicGameState>,
        required: true
    },
    playerPrivateState: {
        type: Object as PropType<TicketToRidePlayerPrivateState>,
        required: false
    },
    localPlayerIndex: {
        type: Number,
        required: false
    }
})

</script>

<style scoped>
.field {
    max-height: 600px;
    width: 100%;
}

.rail-path {
    fill: #00000000;
    cursor: pointer;
    stroke-width: 1px;
}

.selected-rail-path {
    fill: #00000000;
    animation: colorLoop 1s infinite linear alternate;
}

@keyframes colorLoop {
    0% {
        fill: #00000000;
    }

    100% {
        fill: #00ff08a1;
    }
}

.city {
    fill: #00000000;
    cursor: pointer;
}

.selected-city {
    fill: #00000000;
    animation: colorLoop 1s infinite linear alternate;
}

.route-selected-city {
    fill: #00ff0087;
}

.selected-route-line {
    stroke: #00ff0087;
    stroke-width: 8px;
    stroke-linecap: round;
}
</style>