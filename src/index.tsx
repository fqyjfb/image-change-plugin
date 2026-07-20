import React from 'react';
import ReactDOM from 'react-dom/client';
import ToolPanel from './ToolPanel';

const PluginApp: React.FC = () => {
  return React.createElement(ToolPanel);
};

function renderStandalone() {
  if (!React || !ReactDOM) {
    console.error('React or ReactDOM is not available');
    return;
  }

  const root = document.getElementById('root');
  if (!root) {
    console.error('Root element not found');
    return;
  }

  if (ReactDOM.createRoot) {
    ReactDOM.createRoot(root).render(React.createElement(PluginApp));
  } else {
    ReactDOM.render(React.createElement(PluginApp), root);
  }
}

function registerPlugin(api: any) {
  const { registerTool, registerSidebarButton, openPluginWindow } = api;

  registerTool({
    id: 'plugin-image-change',
    name: '图片转换',
    iconName: 'Image',
    color: '#3b82f6',
    textColor: '#ffffff',
    path: '/tools/plugin-image-change',
    component: ToolPanel,
  });

  registerSidebarButton({
    id: 'plugin-image-change-btn',
    icon: 'Image',
    label: '图片转换',
    onClick: () => {
      openPluginWindow?.('plugin-image-change');
    },
  });
}

const pluginData = (window as any).__PLUGIN_DATA__;

if (pluginData) {
  renderStandalone();
}