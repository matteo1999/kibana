/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen } from '@testing-library/dom';
import { render, mockAppIndexPattern } from './rtl_helpers';
import { ExploratoryView } from './exploratory_view';
import * as obsvDataViews from '../../../utils/observability_data_views/observability_data_views';
import * as pluginHook from '../../../hooks/use_plugin_context';
import { createStubIndexPattern } from '../../../../../../../src/plugins/data/common/stubs';

jest.spyOn(pluginHook, 'usePluginContext').mockReturnValue({
  appMountParameters: {
    setHeaderActionMenu: jest.fn(),
  },
} as any);
describe('ExploratoryView', () => {
  mockAppIndexPattern();

  beforeEach(() => {
    const indexPattern = createStubIndexPattern({
      spec: {
        id: 'apm-*',
        title: 'apm-*',
        timeFieldName: '@timestamp',
        fields: {
          '@timestamp': {
            name: '@timestamp',
            type: 'date',
            esTypes: ['date'],
            searchable: true,
            aggregatable: true,
            readFromDocValues: true,
          },
        },
      },
    });

    jest.spyOn(obsvDataViews, 'ObservabilityDataViews').mockReturnValue({
      getDataView: jest.fn().mockReturnValue(indexPattern),
    } as any);
  });

  it('renders exploratory view', async () => {
    render(<ExploratoryView />, { initSeries: { data: [] } });

    expect(await screen.findByText(/No series found. Please add a series./i)).toBeInTheDocument();
    expect(await screen.findByText(/Hide chart/i)).toBeInTheDocument();
  });

  it('renders lens component when there is series', async () => {
    render(<ExploratoryView />);

    expect((await screen.findAllByText('Performance distribution'))[0]).toBeInTheDocument();
    expect(await screen.findByText(/Lens Embeddable Component/i)).toBeInTheDocument();

    expect(screen.getByTestId('exploratoryViewSeriesPanel0')).toBeInTheDocument();
  });

  it('shows/hides the chart', async () => {
    render(<ExploratoryView />);
    expect(screen.queryByText('Refresh')).toBeInTheDocument();

    const toggleButton = await screen.findByText('Hide chart');
    expect(toggleButton).toBeInTheDocument();

    toggleButton.click();

    expect(toggleButton.textContent).toBe('Show chart');
    expect(screen.queryByText('Refresh')).toBeNull();
  });
});
