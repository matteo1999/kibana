/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mockKibanaValues, setMockValues } from '../../../../../__mocks__/kea_logic';

import React from 'react';

import { shallow } from 'enzyme';

import { EuiText, EuiButton } from '@elastic/eui';

import {
  PersonalDashboardLayout,
  WorkplaceSearchPageTemplate,
} from '../../../../components/layout';
import { staticSourceData } from '../../source_data';

import { ConfigurationChoice } from './configuration_choice';

describe('ConfigurationChoice', () => {
  const { navigateToUrl } = mockKibanaValues;
  const props = {
    sourceData: staticSourceData[0],
  };
  const mockValues = {
    isOrganization: true,
  };

  beforeEach(() => {
    setMockValues(mockValues);
    jest.clearAllMocks();
  });

  describe('layout', () => {
    it('renders the default workplace search layout when on an organization view', () => {
      setMockValues({ ...mockValues, isOrganization: true });
      const wrapper = shallow(<ConfigurationChoice sourceData={staticSourceData[1]} />);

      expect(wrapper.type()).toEqual(WorkplaceSearchPageTemplate);
    });

    it('renders the personal dashboard layout when not in an organization', () => {
      setMockValues({ ...mockValues, isOrganization: false });
      const wrapper = shallow(<ConfigurationChoice sourceData={staticSourceData[1]} />);

      expect(wrapper.type()).toEqual(PersonalDashboardLayout);
    });
  });

  it('renders internal connector if available', () => {
    const wrapper = shallow(<ConfigurationChoice {...{ ...props }} />);

    expect(wrapper.find('EuiPanel')).toHaveLength(1);
    expect(wrapper.find(EuiText)).toHaveLength(3);
    expect(wrapper.find(EuiButton)).toHaveLength(1);
  });
  it('should navigate to internal connector on internal connector click', () => {
    const wrapper = shallow(<ConfigurationChoice {...props} />);
    const button = wrapper.find(EuiButton);
    button.simulate('click');
    expect(navigateToUrl).toHaveBeenCalledWith('/sources/add/box/internal/');
  });

  it('renders external connector if available', () => {
    const wrapper = shallow(
      <ConfigurationChoice
        {...{
          ...props,
          sourceData: {
            ...props.sourceData,
            internalConnectorAvailable: false,
            externalConnectorAvailable: true,
          },
        }}
      />
    );

    expect(wrapper.find('EuiPanel')).toHaveLength(1);
    expect(wrapper.find(EuiText)).toHaveLength(3);
    expect(wrapper.find(EuiButton)).toHaveLength(1);
  });
  it('should navigate to external connector on external connector click', () => {
    const wrapper = shallow(
      <ConfigurationChoice
        {...{
          ...props,
          sourceData: {
            ...props.sourceData,
            internalConnectorAvailable: false,
            externalConnectorAvailable: true,
          },
        }}
      />
    );
    const button = wrapper.find(EuiButton);
    button.simulate('click');
    expect(navigateToUrl).toHaveBeenCalledWith('/sources/add/box/external/');
  });

  it('renders custom connector if available', () => {
    const wrapper = shallow(
      <ConfigurationChoice
        {...{
          ...props,
          sourceData: {
            ...props.sourceData,
            internalConnectorAvailable: false,
            externalConnectorAvailable: false,
            customConnectorAvailable: true,
          },
        }}
      />
    );

    expect(wrapper.find('EuiPanel')).toHaveLength(1);
    expect(wrapper.find(EuiText)).toHaveLength(3);
    expect(wrapper.find(EuiButton)).toHaveLength(1);
  });
  it('should navigate to custom connector on internal connector click', () => {
    const wrapper = shallow(
      <ConfigurationChoice
        {...{
          ...props,
          sourceData: {
            ...props.sourceData,
            internalConnectorAvailable: false,
            externalConnectorAvailable: false,
            customConnectorAvailable: true,
          },
        }}
      />
    );
    const button = wrapper.find(EuiButton);
    button.simulate('click');
    expect(navigateToUrl).toHaveBeenCalledWith('/sources/add/box/custom/');
  });
});
