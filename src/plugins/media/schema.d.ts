import {xObject} from "../../types";

export interface RendererObject {
  id: string;
  name: string;
  uri: string;
  media?: Object;
  currentMediaItem?: Object;
  offset?: number;
  scan?: "off"|"up"|"down";
  state?: "idle"|"play"|"pause"|"stop"|"ff"|"fr";
  repeat?: "off"|"repeatall"|"repeatone";
  shuffle?: "on"|"off";
  type?: "track"|"video"|"image";
}

export interface CollectionObject {
  id: string;
  name: string;
  uri: string;
  items?: ItemObject[];
}

export interface ItemObject {
  id: string;
  name: string;
  uri: string;
  collection?: CollectionObject;
  renderable?: xObject;
}