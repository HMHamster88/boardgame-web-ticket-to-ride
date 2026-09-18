<template>
    <div class="flex flex-col">
        <span>{{ t('turnCount') }} : {{ statistics.turnCount }}</span>
        <h2>{{ t('playersStats') }}</h2>
        <div v-for="playerStat in statistics.playersStatistics" style="margin-bottom: 1rem;">
            <h3>{{ getPlayer(playerStat.playerId)?.name }}</h3>
            <div style="margin-left: 0.5rem;">
                <div v-if="playerStat.routeStatistics.length > 0">
                    <h4>{{ t('routes') }}</h4>
                    <div v-for="route in playerStat.routeStatistics">
                        {{ route.routeId }} = {{ route.points }}
                    </div>
                    {{ t('total') + routesTotal(playerStat.routeStatistics) }}
                </div>
                <div v-if="playerStat.buildedPaths.length > 0">
                    <h4>{{ t('buildedPaths') }}</h4>
                    <div v-for="buildedPath in playerStat.buildedPaths">
                        {{ buildedPath.length }} : {{ buildedPath.count }} x {{ pointsByRailLength[buildedPath.length]
                        }} =
                        {{ pointsByRailLength[buildedPath.length] * buildedPath.count }}
                    </div>
                    {{ t('total') + buildedPathsTotal(playerStat.buildedPaths) }}
                </div>
                <div v-if="playerStat.stations != 0">
                    <h4>{{ t('stations') }}</h4>
                    {{ playerStat.stations }} x {{ stationPoints }} = {{ playerStat.stations * stationPoints }}
                </div>
                <h4 v-if="playerStat.longestPath">{{ t('longestPath') + longestPathPoints }}</h4>
                <h4>{{ t('totalPoints') + totalPoints(playerStat) }}</h4>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import type { Game } from 'boardgame-web-common';
import { longestPathPoints, pointsByRailLength, stationPoints, type BuiledPathStats, type PlayerStatistics, type RouteStatistics, type TicketToRideGameSettings, type TicketToRideGameStatistics } from 'ticket-to-ride-back';
import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';


let localization: any = {
    en: {
        turnCount: 'Turn Count',
        playersStats: 'Players Stats',
        routes: 'Routes',
        buildedPaths: 'Builded paths',
        total: 'Total: ',
        longestPath: 'Longest path: ',
        stations: 'Stations',
        totalPoints: 'Total points: '
    },
    ru: {
        turnCount: 'Количество Ходов',
        playersStats: 'Статистика игроков',
        routes: 'Маршруты',
        buildedPaths: 'Построенные пути',
        total: 'Сумарно: ',
        longestPath: 'Самый длинный путь: ',
        stations: 'Станции',
        totalPoints: 'Всего очков: '
    }
}
const { t } = useI18n({
    locale: 'en',
    messages: localization
})

function getPlayer(playerId: string) {
    return props.game.players.find(pl => pl.userId == playerId)
}

function buildedPathsTotal(buildedPaths: BuiledPathStats[]) {
    let result = 0
    buildedPaths.forEach(path => result += pointsByRailLength[path.length] * path.count)
    return result
}

function routesTotal(routes: RouteStatistics[]) {
    let result = 0
    routes.forEach(route => result += route.points)
    return result
}

function totalPoints(playerStats: PlayerStatistics) {
    let result = buildedPathsTotal(playerStats.buildedPaths)
    result += routesTotal(playerStats.routeStatistics)
    result += playerStats.stations * stationPoints
    if (playerStats.longestPath) {
        result += longestPathPoints
    }
    return result
}

const props = defineProps({
    statistics: {
        type: Object as PropType<TicketToRideGameStatistics>,
        required: true
    },
    game: {
        type: Object as PropType<Game>,
        required: true
    },
    settings: {
        type: Object as PropType<TicketToRideGameSettings>,
        required: true
    }
})
</script>

<style>
.progress {
    margin: 0.2rem;
    height: 1.5em;
    width: 100%;
    background-color: var(--oruga-control-background-color);
    position: relative;
    border-width: var(--oruga-control-border-width);
    border-style: solid;
    border-color: var(--oruga-control-border-color);
    border-radius: var(--oruga-border-radius);
}

.progress:before {
    content: attr(data-label);
    font-size: 0.8em;
    position: absolute;
    text-align: center;
    left: 0;
    right: 0;
}

.progress .value {
    background-color: var(--main-color);
    display: inline-block;
    height: 100%;
}

.resource-icon {
    width: 2rem;
    max-width: 2rem;
}
</style>