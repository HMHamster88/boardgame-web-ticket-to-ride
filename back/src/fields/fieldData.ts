import { TicketToRideFieldType, type Size } from "../types/types";

export interface RailData {
    x: number;
    y: number;
    transform: string;
}

export enum RailColor {
    BLACK = 'BLACK',
    BLUE = 'BLUE',
    GREEN = 'GREEN',
    GRAY = 'GRAY',
    ORANGE = 'ORANGE',
    PURPLE = 'PURPLE',
    RED = 'RED',
    WHITE = 'WHITE',
    YELLOW = 'YELLOW'
}

export interface RailPathData {
    id: string
    color: RailColor
    isTunnel: boolean
    locomotiveCount: number
    rects: RailData[],
    from: string,
    to: string
}

export interface CityData {
    id: string,
    cx: number,
    cy: number
}

export interface Route {
    id: string
    from: string
    to: string
    points: number
    isLong: boolean
}

export interface FieldData {
    size: Size
    railPaths: RailPathData[]
    rectSize: Size
    cities: CityData[]
    cityRadius: number,
    routes: Route[]
}

import EUROPE from "./EUROPE.json" with { type: "json" };

export const fieldsDatas: Record<TicketToRideFieldType, FieldData> = {
    [TicketToRideFieldType.EUROPE]: EUROPE as FieldData
}
