/*
  This script initializes the metadata containers and entity
  registries.
  Include this first, always in the root file.
*/
import 'reflect-metadata'
import './services/impl'
import Container from 'typedi'
import * as routingControllers from 'routing-controllers'

routingControllers.useContainer(Container)
