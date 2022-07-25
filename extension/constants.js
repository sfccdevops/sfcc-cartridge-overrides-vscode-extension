'use strict'

const path = require('path')

const REGEXP_SEP = path.sep.replace('\\', '\\\\')

const REGEXP_CARTRIDGE = new RegExp(`^(.+)${REGEXP_SEP}cartridges${REGEXP_SEP}([^${REGEXP_SEP}]+)${REGEXP_SEP}cartridge${REGEXP_SEP}(.+)$`)
const REGEXP_PATH = new RegExp(`[${REGEXP_SEP}.]`, 'g')

module.exports = {
  REGEXP_CARTRIDGE,
  REGEXP_PATH,
  REGEXP_SEP,
  SEP: path.sep,
}
