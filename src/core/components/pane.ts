/**
 * Web component: draggable/resizable pane for use within a docking system.
 * Light DOM with drag handles and resize grips.
 *
 * Usage:
 *   <rs-pane id="inspector" data-zone="right">
 *     <div data-pane-header>Inspector</div>
 *     <div data-pane-content><!-- content here --></div>
 *     <div data-pane-grip></div>
 *   </rs-pane>
 *
 * Attributes:
 *   - id: required pane identifier
 *   - data-zone: initial zone ('left' | 'right' | 'top' | 'bottom' | 'center')
 *   - floating: 'true' if initially floating
 *   - float-x, float-y: initial floating position
 *
 * Slots:
 *   - unnamed: pane content
 *   - header: draggable header (drag-handle)
 *   - grip: resize grip
 *
 * Methods:
 *   - float(x, y): float the pane to given coordinates
 *   - dock(zone): move pane to a zone
 *   - popOut(mode): pop out to separate window ('pip' | 'satellite' | 'auto')
 *   - setDragHandle(el): set element that triggers drag
 *   - setResizeGrip(el): set element that triggers resize
 *
 * Events:
 *   - pane-drag-start: when user starts dragging
 *   - pane-drag-end: when drag ends
 *   - pane-resize: fired with { detail: { width?, height? } }
 *   - pane-zone-change: fired with { detail: { zone } }
 *   - pane-float: fired when pane becomes floating
 *   - pane-dock: fired when pane is docked to zone
 */
export class RSPane extends HTMLElement {
  private dragHandle: HTMLElement | null = null;
  private resizeGrip: HTMLElement | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  connectedCallback(): void {
    this.className = 'rs-pane';
    const zone = this.getAttribute('data-zone');
    if (zone) this.setAttribute('data-current-zone', zone);

    const floating = this.getAttribute('floating') === 'true';
    if (floating) {
      this.classList.add('rs-pane-floating');
      const x = parseInt(this.getAttribute('float-x') || '0', 10);
      const y = parseInt(this.getAttribute('float-y') || '0', 10);
      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
    }

    // Find or auto-assign drag handle
    this.dragHandle = this.querySelector('[data-pane-header]') as HTMLElement;
    if (this.dragHandle) {
      this.dragHandle.classList.add('rs-pane-draggable');
      this.dragHandle.addEventListener('mousedown', (e) => this.startDrag(e));
    }

    // Find or auto-assign resize grip
    this.resizeGrip = this.querySelector('[data-pane-grip]') as HTMLElement;
    if (this.resizeGrip) {
      this.resizeGrip.classList.add('rs-pane-grip');
      this.resizeGrip.addEventListener('mousedown', (e) => this.startResize(e));
    }
  }

  setDragHandle(el: HTMLElement): void {
    if (this.dragHandle) {
      this.dragHandle.removeEventListener('mousedown', (e) => this.startDrag(e));
    }
    this.dragHandle = el;
    this.dragHandle.classList.add('rs-pane-draggable');
    this.dragHandle.addEventListener('mousedown', (e) => this.startDrag(e));
  }

  setResizeGrip(el: HTMLElement): void {
    if (this.resizeGrip) {
      this.resizeGrip.removeEventListener('mousedown', (e) => this.startResize(e));
    }
    this.resizeGrip = el;
    this.resizeGrip.classList.add('rs-pane-grip');
    this.resizeGrip.addEventListener('mousedown', (e) => this.startResize(e));
  }

  private startDrag(e: MouseEvent): void {
    if (this.isDragging || !this.dragHandle) return;

    e.preventDefault();
    this.isDragging = true;

    // Calculate offset from mouse to pane position
    const rect = this.getBoundingClientRect();
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragOffsetX = rect.left;
    this.dragOffsetY = rect.top;

    this.classList.add('rs-pane-dragging');
    this.dispatchEvent(new CustomEvent('pane-drag-start', { bubbles: true }));

    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - this.dragStartX;
      const deltaY = ev.clientY - this.dragStartY;
      this.style.left = `${this.dragOffsetX + deltaX}px`;
      this.style.top = `${this.dragOffsetY + deltaY}px`;
    };

    const onUp = () => {
      this.isDragging = false;
      this.classList.remove('rs-pane-dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.dispatchEvent(new CustomEvent('pane-drag-end', { bubbles: true }));
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private startResize(e: MouseEvent): void {
    e.preventDefault();

    const startWidth = this.offsetWidth;
    const startHeight = this.offsetHeight;
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;

      const newWidth = Math.max(100, startWidth + deltaX);
      const newHeight = Math.max(100, startHeight + deltaY);

      this.style.width = `${newWidth}px`;
      this.style.height = `${newHeight}px`;

      this.dispatchEvent(
        new CustomEvent('pane-resize', {
          detail: { width: newWidth, height: newHeight },
          bubbles: true,
        }),
      );
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  float(x: number, y: number): void {
    this.classList.add('rs-pane-floating');
    this.style.position = 'fixed';
    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
    this.setAttribute('data-current-zone', 'floating');
    this.dispatchEvent(
      new CustomEvent('pane-float', {
        detail: { x, y },
        bubbles: true,
      }),
    );
  }

  dock(zone: 'left' | 'right' | 'top' | 'bottom' | 'center'): void {
    this.classList.remove('rs-pane-floating');
    this.style.position = '';
    this.style.left = '';
    this.style.top = '';
    this.style.width = '';
    this.style.height = '';
    this.setAttribute('data-current-zone', zone);
    this.dispatchEvent(
      new CustomEvent('pane-dock', {
        detail: { zone },
        bubbles: true,
      }),
    );
  }

  popOut(mode: 'pip' | 'satellite' | 'auto' = 'auto'): void {
    // Platform-specific implementation will handle this.
    // Emit event so docking system can intercept and implement.
    this.dispatchEvent(
      new CustomEvent('pane-pop-out', {
        detail: { mode },
        bubbles: true,
        composed: true,
      }),
    );
  }

  getZone(): string | null {
    return this.getAttribute('data-current-zone');
  }

  isFloating(): boolean {
    return this.classList.contains('rs-pane-floating');
  }
}

customElements.define('rs-pane', RSPane);
