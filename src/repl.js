'use strict'

const chalk = require('chalk')
const readline = require('readline')
const renderTable = require('./renderTable')
const parse = require('@herrfugbaum/q')
const _ = require('lodash')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.cyan('QSV> '),
})

const orderBy = (data, columns, orders) => {
  if (orders.length > 0) {
    const lowerOrders = orders.map(order => order.toLowerCase())
    return _.orderBy(data, columns, lowerOrders)
  }
  return data
}

const limit = (limit, arr) => {
  const start = 0
  const stop = limit || arr.length - 1
  return _.slice(arr, start, stop)
}

const getData = (sqlParserResult, parsedData) => {
  console.log(sqlParserResult)
  let columnOrders = []
  let columnsToOrder = []
  const limitStop = sqlParserResult.limitClause
    ? sqlParserResult.limitClause.limit
    : false
  if (sqlParserResult.orderByClause) {
    // temporarily hardcoded as arrays, until the parser is ready to understand multiple order by conditions
    columnOrders = [sqlParserResult.orderByClause.condition]
    columnsToOrder = [sqlParserResult.orderByClause.expression]
  }
  if (sqlParserResult.type === 'SELECT_STMT') {
    const columns = sqlParserResult.selectClause.columns

    if (columns[0] !== '*') {
      const selectedColumns = _.map(parsedData, obj => _.pick(obj, columns))
      const result = limit(
        limitStop,
        orderBy(selectedColumns, columnsToOrder, columnOrders),
      )
      return result
    }
    return limit(limitStop, orderBy(parsedData, columnsToOrder, columnOrders))
  }
}

const repl = parsedData => {
  rl.prompt()

  rl.on('line', line => {
    const sqlParserResult = parse(line)
    const processedTable = getData(sqlParserResult, parsedData)

    process.stdout.write(renderTable(processedTable))
    process.stdout.write('\n')
    rl.prompt()
  })
}

module.exports = repl
