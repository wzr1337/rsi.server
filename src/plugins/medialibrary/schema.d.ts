import {xObject} from "../../types";

/* this interface was auto generated from schema.json*/
export interface mediaLibrarySourceObject {
  id: string;
  name: string;
  uri: string;
  rootfolder?: folderObject;
}

/* this export interface was auto generated from schema.json*/
export interface trackObject {
  id: string;
  name: string;
  uri: string;
  image?: string;
  genres?: genreObject[];
  folders?: folderObject[];
  rating?: number;
  albums?: albumObject[];
  artists?: artistObject[];
  date?: string;
  disc?: number;
  duration?: number;
  source?: mediaLibrarySourceObject;
}

/* this interface was auto generated from schema.json*/
export interface albumObject {
  id: string;
  name: string;
  uri: string;
  genres?: genreObject[];
  image?: string;
  rating?: number;
  artists?: artistObject[];
  date?: string;
  duration?: number;
  tracks?: trackObject[];
}

/* this interface was auto generated from schema.json*/
export interface artistObject {
  id: string;
  name: string;
  uri: string;
  genres?: genreObject[];
  image?: string;
  rating?: number;
  albums?: albumObject[];
  tracks?: trackObject[];
}

/* this interface was auto generated from schema.json*/
export interface genreObject {
  id: string;
  name: string;
  uri: string;
  rating?: number;
  tracks?: trackObject[];
}

/* this interface was auto generated from schema.json*/
export interface playlistObject {
  id: string;
  name: string;
  uri: string;
  genres?: genreObject[];
  folders?: folderObject;
  image?: string;
  rating?: number;
  artists?: artistObject[];
  date?: string;
  duration?: number;
  tracks?: trackObject[];
}

/* this interface was auto generated from schema.json*/
export interface folderObject {
  id: string;
  name: string;
  uri: string;
  tracks?: trackObject[];
  playlists?: playlistObject[];
  folders?: folderObject[];
  abspath?: string;
  parent?: folderObject;
}
