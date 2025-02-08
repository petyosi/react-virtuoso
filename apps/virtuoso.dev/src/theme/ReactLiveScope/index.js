import React from "react";
import * as V from "react-virtuoso";
import * as VV from "@virtuoso.dev/message-list";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import * as PangeaDND from "@hello-pangea/dnd";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import * as Tanstack from "@tanstack/react-table";
import * as CC from "./ChatChannel";
import * as Falso from "@ngneat/falso";

const MUIList = {
  List,
  ListSubheader,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
};

const MUITable = {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
};

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  ...V,
  ...VV,
  ...CC,
  ...Falso,
  MUIList,
  MUITable,
  PangeaDND,
  Tanstack,
};
export default ReactLiveScope;
