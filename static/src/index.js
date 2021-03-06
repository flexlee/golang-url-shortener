import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { HashRouter, Route, Link } from 'react-router-dom'
import { Menu, Container, Modal, Button, Image, Icon } from 'semantic-ui-react'
import toastr from 'toastr'
import 'semantic-ui-css/semantic.min.css';
import 'toastr/build/toastr.css';

import About from './About/About'
import Home from './Home/Home'
import ShareX from './ShareX/ShareX'
import Lookup from './Lookup/Lookup'
import Recent from './Recent/Recent'
import Visitors from './Visitors/Visitors'

import util from './util/util'
export default class BaseComponent extends Component {
    state = {
        oAuthPopupOpened: true,
        userData: {},
        authorized: false,
        activeItem: "",
        info: null
    }

    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    onOAuthClose = () => {
        this.setState({ oAuthPopupOpened: true })
    }

    componentWillMount() {
        fetch('/api/v1/info')
            .then(d => d.json())
            .then(info => this.setState({ info }))
            .then(() => this.checkAuth())
            .catch(e => util._reportError(e, "info"))
    }

    checkAuth = () => {
        const token = window.localStorage.getItem('token');
        if (token) {
            fetch('/api/v1/auth/check', {
                method: 'POST',
                body: JSON.stringify({
                    Token: token
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.ok ? res.json() : Promise.reject(`incorrect response status code: ${res.status}; text: ${res.statusText}`))
                .then(d => this.setState({
                    userData: d,
                    authorized: true
                }))
                .catch(e => {
                    toastr.error(`Could not fetch check: ${e}`)
                    window.localStorage.removeItem('token');
                    this.setState({ authorized: false })
                })
        }
    }

    onOAuthCallback = data => {
        if (data.isTrusted) {
            // clear the old event listener, so that the event can only emitted be once
            window.removeEventListener('message', this.onOAuthCallback);
            window.localStorage.setItem('token', data.data);
            this.checkAuth();
            this._oAuthPopup = null;
        }
    }

    onOAuthClick = provider => {
        window.addEventListener('message', this.onOAuthCallback, false);
        var url = `${window.location.origin}/api/v1/auth/${provider}/login`;
        if (!this._oAuthPopup || this._oAuthPopup.closed) {
            // Open the oAuth window that is it centered in the middle of the screen
            var wwidth = 400,
                wHeight = 500;
            this._oAuthPopup = window.open(url, 'Authenticate with OAuth 2.0', `width=${wwidth}, height=${wHeight}, top=${(window.screen.height / 2) - (wHeight / 2)}, left=${(window.screen.width / 2) - (wwidth / 2)}`)
        } else {
            this._oAuthPopup.location = url;
        }
    }

    handleLogout = () => {
        window.localStorage.removeItem("token")
        this.setState({ authorized: false })
    }

    render() {
        const { oAuthPopupOpened, authorized, activeItem, userData, info } = this.state
        if (!authorized) {
            return (
                <Modal size='tiny' open={oAuthPopupOpened} onClose={this.onOAuthClose}>
                    <Modal.Header>
                        Authentication
                    </Modal.Header>
                    <Modal.Content>
                        <p>The following authentication services are currently available:</p>
                        {info && <div className='ui center aligned segment'>
                            {info.providers.length === 0 && <p>There are currently no correct oAuth credentials maintained.</p>}
                            {info.providers.includes("google") && <div>
                                <Button className='ui google plus button' onClick={this.onOAuthClick.bind(this, "google")}>
                                    <Icon name='google' /> Login with Google
                                </Button>
                                {info.providers.includes("github") && <div className="ui divider"></div>}
                            </div>}
                            {info.providers.includes("github") && <div>
                                <Button style={{ backgroundColor: "#333", color: "white" }} onClick={this.onOAuthClick.bind(this, "github")}>
                                    <Icon name='github' /> Login with GitHub
                                </Button>
                            </div>}
                            {info.providers.includes("microsoft") && <div>
                                <div className="ui divider"></div>
                                <Button style={{ backgroundColor: "#0067b8", color: "white" }} onClick={this.onOAuthClick.bind(this, "microsoft")}>
                                    <Icon name='windows' /> Login with Microsoft
                                </Button>
                            </div>}
                        </div>}
                    </Modal.Content>
                </Modal >
            )
        }
        return (
            <HashRouter>
                <Container style={{ padding: "15px 0" }}>
                    <Menu stackable>
                        <Menu.Item as={Link} to="/" name='shorten' onClick={this.handleItemClick} >
                            <Image src={userData.Picture} alt='user profile' circular size='mini' />
                        </Menu.Item>
                        <Menu.Item name='shorten' active={activeItem === 'shorten'} onClick={this.handleItemClick} as={Link} to="/">
                            Shorten
                        </Menu.Item>
                        <Menu.Item name='ShareX' active={activeItem === 'ShareX'} onClick={this.handleItemClick} as={Link} to="/sharex">
                            ShareX
                        </Menu.Item>
                        <Menu.Item name='recent' active={activeItem === 'recent'} onClick={this.handleItemClick} as={Link} to="/recent">
                            Recent URLs
                        </Menu.Item>
                        <Menu.Item name='lookup' active={activeItem === 'lookup'} onClick={this.handleItemClick} as={Link} to="/lookup">
                            Lookup
                        </Menu.Item>
                        <Menu.Item name='about' active={activeItem === 'about'} onClick={this.handleItemClick} as={Link} to={{
                            pathname: "/about",
                            state: { info }
                        }}>
                            About
                        </Menu.Item>
                        <Menu.Menu position='right'>
                            <Menu.Item onClick={this.handleLogout}>Logout</Menu.Item>
                        </Menu.Menu>
                    </Menu>
                    <Route exact path="/" component={Home} />
                    <Route path="/about" render={() => <About info={info} />} />
                    <Route path="/ShareX" component={ShareX} />
                    <Route path="/Lookup" component={Lookup} />
                    <Route path="/recent" component={Recent} />
                    <Route path="/visitors/:id" component={Visitors} />
                </Container>
            </HashRouter>
        )
    }
}

ReactDOM.render((
    <BaseComponent />
), document.getElementById('root'))
