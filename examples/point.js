/* eslint no-console:0 */

import React from 'react';
import ReactDOM from 'react-dom';
import ClickOutside from 'react-click-outside';
import placements from './placements';

import CtxMenuTrigger from '../src';
import 'react-ctxmenu/assets/index.less';
import './point.less';

function InnerTrigger({ onClose }) {
  return (
    <ClickOutside onClickOutside={onClose}>
      <div
        style={{ padding: 20, background: 'rgba(0, 255, 0, 0.3)' }}
      >
        This is popup
      </div>
    </ClickOutside>
  );
}

class Test extends React.Component {
  state = {
    action: 'contextMenu',
    showPopup: false,
    point: {},
  }

  handleCtxMenu = (e) => {
    e.preventDefault();
    this.setState({
      showPopup: true,
      point: {
        pageX: e.pageX,
        pageY: e.pageY,
      },
    });
  }

  handleClose = () => {
    this.setState({
      showPopup: false,
    });
  }

  render() {
    const { action } = this.state;

    return (
      <div>
        <div
          style={{
            border: '1px solid red',
            padding: '100px 0',
            textAlign: 'center',
          }}
          onContextMenu={this.handleCtxMenu}
        >
          Interactive region
        </div>


        <div style={{ margin: 50 }}>
          <CtxMenuTrigger
            popupPlacement="bottomLeft"
            popupVisible={this.state.showPopup}
            action={[action]}
            popupAlign={{
              overflow: {
                adjustX: 1,
                adjustY: 1,
              },
            }}
            point={this.state.point}
            popupClassName="point-popup"
            builtinPlacements={placements}
            popup={(
              <InnerTrigger
                onClose={this.handleClose}
              />
            )}
            alignPoint
          />
        </div>
      </div>
    );
  }
}


ReactDOM.render(<Test />, document.getElementById('__react-content'));
