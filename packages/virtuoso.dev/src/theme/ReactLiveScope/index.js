/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { GroupedVirtuoso, Virtuoso, VirtuosoGrid } from "react-virtuoso";
import faker from "faker";
import styled from "@emotion/styled";
import { groupBy } from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import * as ReactSortableHOC from "react-sortable-hoc";

const randomHeight = () => Math.floor(Math.random() * 30 + 24);

const generateRandomItems = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    text: `Item ${i + 1}`,
    height: randomHeight(),
    longText: faker.lorem.paragraphs(1),
  }));
};

const avatar = () =>
  React.createElement("img", {
    src: "/img/avatar.png",
    style: { width: 50, height: 50, display: "block" },
  });

const avatarPlaceholder = (text = " ") =>
  React.createElement(
    "div",
    {
      style: {
        backgroundColor: "#eef2f4",
        borderRadius: "50%",
        width: 50,
        height: 50,
      },
    },
    text
  );

const generated = [];

function user() {
  let firstName = faker.name.firstName();
  let lastName = faker.name.lastName();

  return {
    name: `${firstName} ${lastName}`,
    initials: `${firstName.substr(0, 1)}${lastName.substr(0, 1)}`,
    description: faker.company.catchPhrase(),
    bgColor: faker.commerce.color(),
    fgColor: faker.commerce.color(),
    longText: faker.lorem.paragraphs(4),
  };
}
export const getUser = (index) => {
  if (!generated[index]) {
    generated[index] = user();
  }

  return generated[index];
};

const userSorter = (a, b) => {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
};
export const generateGroupedUsers = (length) => {
  const users = Array.from({ length })
    .map((_, i) => getUser(i))
    .sort(userSorter);
  const groupedUsers = groupBy(users, (user) => user.name[0]);
  const groupCounts = Object.values(groupedUsers).map((users) => users.length);
  const groups = Object.keys(groupedUsers);

  return { users, groupCounts, groups };
};

// Add react-live imports you need here
const ReactLiveScope = {
  ReactSortableHOC,
  React,
  ...React,
  Virtuoso,
  GroupedVirtuoso,
  VirtuosoGrid,
  generateRandomItems,
  avatar,
  avatarPlaceholder,
  getUser,
  user,
  generateGroupedUsers,
  styled,
  MaterialUI: {
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListSubheader,
    makeStyles,
  },
};

export default ReactLiveScope;
