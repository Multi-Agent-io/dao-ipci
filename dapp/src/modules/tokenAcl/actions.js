import _ from 'lodash'
import Promise from 'bluebird'
import { LOAD_MODULE, CALL_FUNC } from './actionTypes'
import { getContractByAbiName, coinbase, listenAddress } from '../../utils/web3'
import { submit as submitContract, send as sendContract, call as callContract } from '../dao/actions'

export function loadModule(tokenAclAddress) {
  return (dispatch) => {
    getContractByAbiName('TokenEmissionACL', tokenAclAddress)
      .then(contract => (
        Promise.join(
          contract.call('name'),
          contract.call('emitentGroup'),
          contract.call('decimals'),
          contract.call('symbol'),
          contract.call('balanceOf', [coinbase()]),
          contract.call('totalSupply'),
          (name, aclGroup, decimalsR, symbolR, balance, totalSupply) => {
            const decimalsFormat = _.toNumber(decimalsR)
            let decimals = decimalsFormat
            if (decimals > 0) {
              decimals = Math.pow(10, decimals)
            } else {
              decimals = 1
            }
            const symbol = symbolR
            return {
              name,
              aclGroup,
              balance: (_.toNumber(balance) / decimals).toFixed(decimalsFormat) + ' ' + symbol,
              totalSupply: (_.toNumber(totalSupply) / decimals).toFixed(decimalsFormat) + ' ' + symbol,
              decimals
            }
          }
        )
      ))
      .then((token) => {
        dispatch({
          type: LOAD_MODULE,
          payload: {
            address: tokenAclAddress,
            ...token
          }
        })
        listenAddress(tokenAclAddress, 'loadModule', (address) => {
          dispatch(loadModule(address))
        })
      })
  }
}

export function submit(address, action, form) {
  return (dispatch) => {
    const formData = form;
    if (action === 'emission' || action === 'transfer' || action === 'approve') {
      getContractByAbiName('TokenEmissionACL', address)
        .then(contract => contract.call('decimals'))
        .then((result) => {
          let decimals = _.toNumber(result)
          if (decimals > 0) {
            decimals = Math.pow(10, decimals)
          } else {
            decimals = 1
          }
          formData.value *= decimals
          return submitContract(dispatch, 'FormTokenAcl', address, 'TokenEmissionACL', action, formData)
        })
    } else {
      submitContract(dispatch, 'FormTokenAcl', address, 'TokenEmissionACL', action, formData)
    }
  }
}

export function send(address, action, values) {
  return (dispatch) => {
    sendContract(dispatch, address, 'TokenEmissionACL', action, values)
  }
}

function normalResultCall(contract, action, output) {
  if (action === 'balanceOf') {
    let decimalsFormat
    let decimals
    return contract.call('decimals')
      .then((result) => {
        decimalsFormat = _.toNumber(result)
        decimals = decimalsFormat
        return contract.call('symbol')
      })
      .then((symbol) => {
        if (decimals > 0) {
          decimals = Math.pow(10, decimals)
        } else {
          decimals = 1
        }
        return (_.toNumber(output) / decimals).toFixed(decimalsFormat) + ' ' + symbol
      })
  }
  return output.toString()
}

export function call(address, action, form) {
  return (dispatch) => {
    let contract
    getContractByAbiName('TokenEmissionACL', address)
      .then((result) => {
        contract = result
        return callContract(dispatch, 'FormTokenAclFunc', contract, action, form)
      })
      .then(result => normalResultCall(contract, action, result))
      .then((result) => {
        dispatch({
          type: CALL_FUNC,
          payload: {
            address,
            action,
            input: form,
            output: result
          }
        })
      })
  }
}
