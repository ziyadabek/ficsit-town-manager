import { describe, it, expect, beforeEach } from 'vitest';
import { useFactoryStore } from '../store/useFactoryStore';

describe('Responsive Layout & UI Adaptation', () => {
  beforeEach(() => {
    // Reset right panel state before each test
    useFactoryStore.getState().setRightPanelOpen(true);
  });

  it('provides isRightPanelOpen state and toggleRightPanel action', () => {
    const store = useFactoryStore.getState();
    expect(typeof store.isRightPanelOpen).toBe('boolean');
    expect(typeof store.toggleRightPanel).toBe('function');
    expect(typeof store.setRightPanelOpen).toBe('function');

    expect(store.isRightPanelOpen).toBe(true);

    store.toggleRightPanel();
    expect(useFactoryStore.getState().isRightPanelOpen).toBe(false);

    store.toggleRightPanel();
    expect(useFactoryStore.getState().isRightPanelOpen).toBe(true);

    store.setRightPanelOpen(false);
    expect(useFactoryStore.getState().isRightPanelOpen).toBe(false);

    store.setRightPanelOpen(true);
    expect(useFactoryStore.getState().isRightPanelOpen).toBe(true);
  });

  it('supports right panel collapse without affecting solver or targets state', () => {
    const store = useFactoryStore.getState();
    store.addTarget();
    const targetCount = useFactoryStore.getState().targets.length;

    store.setRightPanelOpen(false);
    expect(useFactoryStore.getState().targets.length).toBe(targetCount);
    expect(useFactoryStore.getState().isRightPanelOpen).toBe(false);

    store.setRightPanelOpen(true);
    expect(useFactoryStore.getState().targets.length).toBe(targetCount);
    expect(useFactoryStore.getState().isRightPanelOpen).toBe(true);
  });

  it('simulates viewport breakpoint categories (1920, 1366, 1280, 1024, 768, 390)', () => {
    const viewports = [
      { name: '1920x1080 (Large Monitor)', width: 1920, height: 1080, isDesktop: true, isOverlay: false },
      { name: '1366x768 (Standard Laptop)', width: 1366, height: 768, isDesktop: true, isOverlay: false },
      { name: '1280x720 (Compact Laptop HD)', width: 1280, height: 720, isDesktop: true, isOverlay: false },
      { name: '1024x768 (Narrow Desktop / iPad)', width: 1024, height: 768, isDesktop: true, isOverlay: false },
      { name: '768x1024 (Tablet Portrait)', width: 768, height: 1024, isDesktop: false, isOverlay: true },
      { name: '390x844 (Mobile Portrait)', width: 390, height: 844, isDesktop: false, isOverlay: true },
    ];

    viewports.forEach(vp => {
      // lg: breakpoint in Tailwind is 1024px
      const isLg = vp.width >= 1024;
      expect(isLg).toBe(vp.isDesktop);
      const isOverlay = vp.width < 1024;
      expect(isOverlay).toBe(vp.isOverlay);
    });
  });
});
