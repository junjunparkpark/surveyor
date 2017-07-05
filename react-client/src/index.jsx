import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import JobList from './components/JobList.jsx';
import JobListItem from './components/JobListItem.jsx';
import Save from './components/Save.jsx';
import Load from './components/Load.jsx';
import Loading from './components/Loading.jsx';
import Dropzone from 'react-dropzone';
import Header from './components/Header.jsx';
import Start from './components/Start.jsx'
import { Input, Menu, Segment, Button } from 'semantic-ui-react'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jobs: [],
      technology: '',
      view: 'search',
      files: [],
      dropzoneActive: false,
      loadingPrevious: false,
      errMsg: '',
      activateBlur: false,
      activeItem: 'home'
    };
    this.onSearch = this.onSearch.bind(this);
    this.saveQuery = this.saveQuery.bind(this);
    this.onTechnologyChange = this.onTechnologyChange.bind(this);
    this.onLoad = this.onLoad.bind(this);
  }

  onTechnologyChange(query) {
    this.setState({
      technology: query
    })
  }

  onSearch(query) {
    this.setState({
      view: 'loading'
    });

    var that = this;
    setTimeout(function() {
      fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({query: query})
      })
      .then((response) => {
        return response.json();
      })
      .then(result => {
        if (result.error) {
          throw err;
        }
        that.setState({
          jobs: result.results,
          view: 'jobs',
          loadingPrevious: false
        });
      })
      .catch(err => {
        that.setState({
          view: 'search',
          loadingPrevious: false,
          errMsg: err + ''
        })
      });
    }, 4000)
  }

  onDragEnter() {
    this.setState({
      dropzoneActive: true,
      activateBlur: true
    });
  }

  onDragLeave() {
    this.setState({
      dropzoneActive: false,
      activateBlur: false
    });
  }

  onDrop(files) {
    this.setState({ view: 'loading', activateBlur: false });
    let formData = new FormData();

    this.setState({ files, dropzoneActive: false });
    formData.append('file', files[0]);

    fetch('/upload', {
      method: 'POST', body: formData
    })
    .then(response => {
      return response.json();
    })
    .then(result => {
      if (result.error) {
        throw err;
      }

      var query = result.join(', ');
      this.setState({ technology: query });
      this.onSearch(query);
    })
    .catch(err => {
      this.setState({ view: 'search', errMsg: err + ''});
    })
  }

  saveQuery(loginData) {
    fetch('/saveQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: loginData.id,
        query: this.state.technology
      }),
    });
  }

  onLoad(loginData) {
    fetch('/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: loginData.id
      })
    })
    .then(response => {
      return response.text()
    })
    .then(query => {
      if (query) {
        this.setState({
          loadingPrevious: true
        })
        this.onSearch(query);
      }
    });
  }

  componentDidMount(props) {
  }

  render () {
    const { accept, files, dropzoneActive, activeItem } = this.state;

    var style = {};
    if (this.state.activateBlur) {
      style = {
        '-webkit-filter': 'blur(3px)',
        '-moz-filter': 'blur(3px)',
        '-o-filter': 'blur(3px)',
        '-ms-filter': 'blur(3px)',
        'filter': 'blur(3px)'
      };
    }

    return (
      <div>
        <div>
					<Menu pointing inverted>
						<Menu.Item name='home' active={activeItem === 'home'} onClick={this.handleItemClick} />
						<Menu.Item name='jobs' active={activeItem === 'messages'} onClick={this.handleItemClick} />
						<Menu.Item name='interviews' active={activeItem === 'friends'} onClick={this.handleItemClick} />
            <Menu.Item name='interviews' active={activeItem === 'friends'} onClick={this.handleItemClick} />
						<Menu.Menu position='right'>
							 <Menu.Item>
                <Button primary>Sign up</Button>
              </Menu.Item>

            <Menu.Item>
              <Button>Log-in</Button>
            </Menu.Item>
						</Menu.Menu>
					</Menu>

					<Segment>
						<img src='/assets/images/wireframe/paragraph.png' />
					</Segment>
				</div>
      <Dropzone
        disableClick
        style={{}}
        accept={accept}
        onDrop={this.onDrop.bind(this)}
        onDragEnter={this.onDragEnter.bind(this)}
        onDragLeave={this.onDragLeave.bind(this)}
      >
        { dropzoneActive && <div className="overlay">Release to Search</div> }
        <div style={style}>
          <Header jobs={this.state.jobs}/>
          <div> <h1 id="title"> Surveyor  &#x1F50D; </h1></div>

  
        { (() => {
            if (this.state.view === 'search') {
              return <Start errMsg={this.state.errMsg} />
            } else if (this.state.view === 'loading') {
              return <Loading loadingPrevious={this.state.loadingPrevious}/>
            } else if (this.state.view === 'jobs') {
              return <JobList jobList={this.state.jobs} saveQuery={this.saveQuery}/>
            } else {
              return null;
            }
          })()
        }
            
        </div>
        <div hidden>
          <Load onLoad={this.onLoad}/>
        </div>
      </Dropzone>
       </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));

