import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import EventList from './components/EventList';
import EventTypeList from './components/EventTypeList';
import EventTypeSettings from './components/EventTypeSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `event-tab-${index}`,
    'aria-controls': `event-tabpanel-${index}`,
  };
}

export default function EventsPage() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="event management tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Events" {...a11yProps(0)} />
          <Tab label="Event Types" {...a11yProps(1)} />
          <Tab label="Event Type Settings" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <EventList />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <EventTypeList />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <EventTypeSettings />
      </TabPanel>
    </Box>
  );
}
