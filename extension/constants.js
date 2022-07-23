'use strict'

const path = require('path')

const REGEXP_CARTRIDGE = new RegExp(`^(.+)${path.sep}cartridges${path.sep}([^${path.sep}]+)${path.sep}cartridge${path.sep}(.+)$`)
const REGEXP_PATH = new RegExp(`[${path.sep}.]`, 'g')

module.exports = {
  REGEXP_CARTRIDGE,
  REGEXP_PATH,
  SEP: path.sep,
}
