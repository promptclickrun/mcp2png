import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Mcp2PngControls, Mcp2PngAppRenderer } from '../src/react.js';

describe('React integration', () => {
  it('renders copy and download controls with accessible labels', () => {
    const html = renderToStaticMarkup(
      <Mcp2PngControls target={null} fileName="example-card.png" labels={{ copy: 'Copy image', download: 'Save image' }} />,
    );

    expect(html).toContain('Copy image');
    expect(html).toContain('Save image');
  });

  it('wraps an AppRenderer-like component without importing @mcp-ui/client', () => {
    const AppRenderer = vi.fn((props: { resource: unknown }) => <div data-rendered="yes">{String(props.resource)}</div>);

    const html = renderToStaticMarkup(
      <Mcp2PngAppRenderer
        AppRenderer={AppRenderer}
        resource="demo-resource"
        controls={{ position: 'after', fileName: 'demo.png' }}
      />,
    );

    expect(AppRenderer).toHaveBeenCalledWith(expect.objectContaining({ resource: 'demo-resource' }), undefined);
    expect(html).toContain('data-mcp2png-capture');
    expect(html).toContain('demo-resource');
    expect(html).toContain('Copy PNG');
  });
});
