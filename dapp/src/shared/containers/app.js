import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import cookie from 'react-cookie'
import { getWeb3, isAccounts, runListener } from '../../utils/web3'

import Header from '../components/app/header'
import Footer from '../components/app/footer'
import Notification from '../components/app/notification'
import Spin from '../components/common/spin'
import Plugin from '../components/app/plugin'
import { flashMessage, setDaoAddress, setLanguage } from '../../modules/app/actions';
import { load as loadCore } from '../../modules/dao/actions';
import { load } from '../../modules/log/actions';

import './style.css'

// @translate(['view', 'nav'], { wait: true })
class App extends Component {
  componentWillMount() {
    const address = cookie.load('dao_address')
    if (address) {
      this.props.setDaoAddress(address)
      if (!this.props.isCoreLoad) {
        this.props.loadCore(address);
      }
    }
    const language = cookie.load('language')
    if (language) {
      this.props.setLanguage(language)
    }
    this.props.loadLog()
    runListener();
  }

  componentWillReceiveProps(next) {
    if (this.props.dao_address !== next.dao_address) {
      this.props.loadCore(next.dao_address);
    }
  }

  render() {
    let content
    if (getWeb3()) {
      if (isAccounts()) {
        if (this.props.isCoreLoad) {
          content = <Spin />
        } else {
          content = this.props.children
        }
      } else {
        content = <p>нет аккаунтов</p>
      }
    } else {
      content = <Plugin />
    }

    return (<div>
      <Header
        title={this.props.title}
        dao_address={this.props.dao_address}
        role={this.props.role}
        language={this.props.language}
        setLanguage={this.props.setLanguage}
        programms={this.props.programms}
        setDaoAddress={this.props.setDaoAddress}
      />
      <div className="container" id="maincontainer">
        {content}
      </div>
      <Footer />
      <Notification message={this.props.flash_message} onClose={() => this.props.flashMessage('')} />
    </div>)
  }
}

function mapStateToProps(state, props) {
  const programms = [
    {
      address: '0x9ee8b04a4a5e301eabdb791fb6ed4e7d815cf90d',
      name: 'IPCI',
    },
    // {
    //   address: '0x950b1e622af76081cd9bc81c0a54be51c9ac932d',
    //   name: 'VCS',
    // },
    // {
    //   address: '0x3',
    //   name: 'Gold Standard',
    // },
  ];
  return {
    title: state.app.title,
    flash_message: state.app.flash_message,
    dao_address: state.app.dao_address,
    role: state.app.role,
    language: state.app.language,
    isCoreLoad: (props.location.pathname === '/') ? false : state.dao.load,
    programms
  }
}
function mapDispatchToProps(dispatch) {
  const actions = bindActionCreators({
    flashMessage,
    setDaoAddress,
    setLanguage,
    load,
    loadCore
  }, dispatch)
  return {
    flashMessage: actions.flashMessage,
    setDaoAddress: actions.setDaoAddress,
    setLanguage: actions.setLanguage,
    loadLog: actions.load,
    loadCore: actions.loadCore
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
