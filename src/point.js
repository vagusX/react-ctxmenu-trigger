import React from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import Portal from 'rc-util/lib/Portal';

import { getAlignFromPlacement, getAlignPopupClassName } from './utils';
import Popup from './Popup';

function noop() {}

function returnEmptyString() {
  return '';
}

function returnDocument() {
  return window.document;
}

const ALL_HANDLERS = [
  'onClick',
  'onMouseDown',
  'onTouchStart',
  'onMouseEnter',
  'onMouseLeave',
  'onFocus',
  'onBlur',
  'onContextMenu',
];

const contextTypes = {
  rcTrigger: PropTypes.shape({
    onPopupMouseDown: PropTypes.func,
  }),
};

class Trigger extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    action: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    showAction: PropTypes.any,
    hideAction: PropTypes.any,
    getPopupClassNameFromAlign: PropTypes.any,
    onPopupVisibleChange: PropTypes.func,
    afterPopupVisibleChange: PropTypes.func,
    popup: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    popupStyle: PropTypes.object,
    prefixCls: PropTypes.string,
    popupClassName: PropTypes.string,
    className: PropTypes.string,
    popupPlacement: PropTypes.string,
    builtinPlacements: PropTypes.object,
    popupTransitionName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    popupAnimation: PropTypes.any,
    mouseEnterDelay: PropTypes.number,
    mouseLeaveDelay: PropTypes.number,
    zIndex: PropTypes.number,
    focusDelay: PropTypes.number,
    blurDelay: PropTypes.number,
    getPopupContainer: PropTypes.func,
    getDocument: PropTypes.func,
    forceRender: PropTypes.bool,
    destroyPopupOnHide: PropTypes.bool,
    mask: PropTypes.bool,
    maskClosable: PropTypes.bool,
    onPopupAlign: PropTypes.func,
    popupAlign: PropTypes.object,
    popupVisible: PropTypes.bool,
    defaultPopupVisible: PropTypes.bool,
    maskTransitionName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    maskAnimation: PropTypes.string,
    stretch: PropTypes.string,
    alignPoint: PropTypes.bool, // Maybe we can support user pass position in the future
    point: PropTypes.object,
  };

  static contextTypes = contextTypes;

  static childContextTypes = contextTypes;

  static defaultProps = {
    prefixCls: 'rc-trigger-popup',
    getPopupClassNameFromAlign: returnEmptyString,
    getDocument: returnDocument,
    onPopupVisibleChange: noop,
    afterPopupVisibleChange: noop,
    onPopupAlign: noop,
    popupClassName: '',
    mouseEnterDelay: 0,
    mouseLeaveDelay: 0.1,
    focusDelay: 0,
    blurDelay: 0.15,
    popupStyle: {},
    destroyPopupOnHide: false,
    popupAlign: {},
    defaultPopupVisible: false,
    mask: false,
    maskClosable: true,
    action: [],
    showAction: [],
    hideAction: [],
  };

  constructor(props) {
    super(props);

    let popupVisible;
    if ('popupVisible' in props) {
      popupVisible = !!props.popupVisible;
    } else {
      popupVisible = !!props.defaultPopupVisible;
    }

    this.state = {
      prevPopupVisible: popupVisible,
      popupVisible,
    };

    ALL_HANDLERS.forEach(h => {
      this[`fire${h}`] = e => {
        this.fireEvents(h, e);
      };
    });
  }

  getChildContext() {
    return {
      rcTrigger: {
        onPopupMouseDown: this.onPopupMouseDown,
      },
    };
  }

  componentWillUnmount() {
    this.clearDelayTimer();
    clearTimeout(this.mouseDownTimeout);
  }

  onPopupMouseDown = (...args) => {
    const { rcTrigger = {} } = this.context;
    this.hasPopupMouseDown = true;

    clearTimeout(this.mouseDownTimeout);
    this.mouseDownTimeout = setTimeout(() => {
      this.hasPopupMouseDown = false;
    }, 0);

    if (rcTrigger.onPopupMouseDown) {
      rcTrigger.onPopupMouseDown(...args);
    }
  };

  static getDerivedStateFromProps({ popupVisible }, prevState) {
    const newState = {};

    if (popupVisible !== undefined && prevState.popupVisible !== popupVisible) {
      newState.popupVisible = popupVisible;
      newState.prevPopupVisible = prevState.popupVisible;
    }

    return newState;
  }

  getRootDomNode = () => {
    return findDOMNode(this);
  };

  getPopupClassNameFromAlign = align => {
    const className = [];
    const {
      popupPlacement,
      builtinPlacements,
      prefixCls,
      alignPoint,
      getPopupClassNameFromAlign,
    } = this.props;
    if (popupPlacement && builtinPlacements) {
      className.push(getAlignPopupClassName(builtinPlacements, prefixCls, align, alignPoint));
    }
    if (getPopupClassNameFromAlign) {
      className.push(getPopupClassNameFromAlign(align));
    }
    return className.join(' ');
  };

  getPopupAlign() {
    const props = this.props;
    const { popupPlacement, popupAlign, builtinPlacements } = props;
    if (popupPlacement && builtinPlacements) {
      return getAlignFromPlacement(builtinPlacements, popupPlacement, popupAlign);
    }
    return popupAlign;
  }

  getComponent = () => {
    const {
      prefixCls,
      destroyPopupOnHide,
      popupClassName,
      action,
      onPopupAlign,
      popupAnimation,
      popupTransitionName,
      popupStyle,
      mask,
      maskAnimation,
      maskTransitionName,
      zIndex,
      popup,
      stretch,
      alignPoint,
      point,
    } = this.props;
    const { popupVisible } = this.state;

    const align = this.getPopupAlign();

    const mouseProps = {};
    mouseProps.onMouseDown = this.onPopupMouseDown;

    return (
      <Popup
        prefixCls={prefixCls}
        destroyPopupOnHide={destroyPopupOnHide}
        visible={popupVisible}
        point={alignPoint && point}
        className={popupClassName}
        action={action}
        align={align}
        onAlign={onPopupAlign}
        animation={popupAnimation}
        getClassNameFromAlign={this.getPopupClassNameFromAlign}
        {...mouseProps}
        stretch={stretch}
        getRootDomNode={this.getRootDomNode}
        style={popupStyle}
        mask={mask}
        zIndex={zIndex}
        transitionName={popupTransitionName}
        maskAnimation={maskAnimation}
        maskTransitionName={maskTransitionName}
        ref={this.savePopup}
      >
        {typeof popup === 'function' ? popup() : popup}
      </Popup>
    );
  };

  getContainer = () => {
    const { props } = this;
    const popupContainer = document.createElement('div');
    // Make sure default popup container will never cause scrollbar appearing
    // https://github.com/react-component/trigger/issues/41
    popupContainer.style.position = 'absolute';
    popupContainer.style.top = '0';
    popupContainer.style.left = '0';
    popupContainer.style.width = '100%';
    const mountNode = props.getPopupContainer
      ? props.getPopupContainer(findDOMNode(this))
      : props.getDocument().body;
    mountNode.appendChild(popupContainer);
    return popupContainer;
  };

  /**
   * @param popupVisible    Show or not the popup element
   * @param event           SyntheticEvent, used for `pointAlign`
   */
  setPopupVisible(popupVisible, event) {
    const { alignPoint } = this.props;
    const { popupVisible: prevPopupVisible } = this.state;

    this.clearDelayTimer();

    if (prevPopupVisible !== popupVisible) {
      if (!('popupVisible' in this.props)) {
        this.setState({ popupVisible, prevPopupVisible });
      }
      this.props.onPopupVisibleChange(popupVisible);
    }

    // Always record the point position since mouseEnterDelay will delay the show
    if (alignPoint && event) {
      this.setPoint(event);
    }
  }

  setPoint = point => {
    const { alignPoint } = this.props;
    if (!alignPoint || !point) return;

    this.setState({
      point: {
        pageX: point.pageX,
        pageY: point.pageY,
      },
    });
  };

  handlePortalUpdate = () => {
    if (this.state.prevPopupVisible !== this.state.popupVisible) {
      this.props.afterPopupVisibleChange(this.state.popupVisible);
    }
  };

  delaySetPopupVisible(visible, delayS, event) {
    const delay = delayS * 1000;
    this.clearDelayTimer();
    if (delay) {
      const point = event ? { pageX: event.pageX, pageY: event.pageY } : null;
      this.delayTimer = setTimeout(() => {
        this.setPopupVisible(visible, point);
        this.clearDelayTimer();
      }, delay);
    } else {
      this.setPopupVisible(visible, event);
    }
  }

  clearDelayTimer() {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
  }

  createTwoChains(event) {
    const childPros = this.props.children.props;
    const props = this.props;
    if (childPros[event] && props[event]) {
      return this[`fire${event}`];
    }
    return childPros[event] || props[event];
  }

  forcePopupAlign() {
    if (this.state.popupVisible && this._component && this._component.alignInstance) {
      this._component.alignInstance.forceAlign();
    }
  }

  fireEvents(type, e) {
    const childCallback = this.props.children.props[type];
    if (childCallback) {
      childCallback(e);
    }
    const callback = this.props[type];
    if (callback) {
      callback(e);
    }
  }

  close() {
    this.setPopupVisible(false);
  }

  savePopup = node => {
    this._component = node;
  };

  render() {
    const { popupVisible } = this.state;
    const { forceRender } = this.props;

    // prevent unmounting after it's rendered
    if (popupVisible || this._component || forceRender) {
      return (
        <Portal
          getContainer={this.getContainer}
          didUpdate={this.handlePortalUpdate}
        >
          {this.getComponent()}
        </Portal>
      );
    }

    return null;
  }
}

export default Trigger;
