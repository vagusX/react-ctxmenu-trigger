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

const contextTypes = {
  rcTrigger: PropTypes.shape({
    onPopupMouseDown: PropTypes.func,
  }),
};

class CtxMenuTrigger extends React.Component {
  // todo: slim props
  static propTypes = {
    getPopupClassNameFromAlign: PropTypes.any,
    popup: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    popupStyle: PropTypes.object,
    prefixCls: PropTypes.string,
    popupClassName: PropTypes.string,
    popupPlacement: PropTypes.string,
    builtinPlacements: PropTypes.object,
    popupTransitionName: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    popupAnimation: PropTypes.any,
    zIndex: PropTypes.number,
    getPopupContainer: PropTypes.func,
    getDocument: PropTypes.func,
    forceRender: PropTypes.bool,
    destroyPopupOnHide: PropTypes.bool,
    mask: PropTypes.bool,
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
    onPopupAlign: noop,
    popupClassName: '',
    popupStyle: {},
    destroyPopupOnHide: false,
    popupAlign: {},
    defaultPopupVisible: false,
    mask: false,
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
  }

  getChildContext() {
    return {
      rcTrigger: {
        onPopupMouseDown: this.onPopupMouseDown,
      },
    };
  }

  componentWillUnmount() {
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
        action={['contextMenu']}
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
        >
          {this.getComponent()}
        </Portal>
      );
    }

    return null;
  }
}

export default CtxMenuTrigger;
