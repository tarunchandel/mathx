import './styles/index.css';
import { App } from './app.js';

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
