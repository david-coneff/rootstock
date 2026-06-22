/**
 * Web component: zone container for docked panes.
 * Part of the docking system layout.
 *
 * Usage:
 *   <rs-zone name="left"></rs-zone>
 *   <rs-zone name="center"></rs-zone>
 *   <rs-zone name="right"></rs-zone>
 *
 * Attributes:
 *   - name: required, one of 'left' | 'right' | 'top' | 'bottom' | 'center'
 *   - resizable: 'true' to allow zone resizing (default: depends on zone)
 *
 * Methods:
 *   - addPane(paneEl): void
 *   - removePane(paneId): void
 *   - getPanes(): RSPane[]
 *
 * The zone container handles layout positioning. Actual pane management
 * is delegated to the parent docking system.
 */
export class RSZone extends HTMLElement {
  private zoneName: string = '';

  connectedCallback(): void {
    this.zoneName = this.getAttribute('name') || '';
    this.className = `rs-zone rs-zone-${this.zoneName}`;
    this.setAttribute('data-zone-name', this.zoneName);
  }

  addPane(paneEl: HTMLElement): void {
    this.appendChild(paneEl);
  }

  removePane(paneId: string): void {
    const pane = this.querySelector(`[id="${paneId}"]`);
    if (pane) pane.remove();
  }

  getPanes(): HTMLElement[] {
    return Array.from(this.children) as HTMLElement[];
  }

  getZoneName(): string {
    return this.zoneName;
  }
}

customElements.define('rs-zone', RSZone);
