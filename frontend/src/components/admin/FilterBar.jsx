import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const FilterBar = ({
  filters,
  onChange,
  fields = [],
  showStatus = false,
  statusOptions = [],
  allowReset = true
}) => {
  const handleChange = (field) => (event) => {
    onChange({ ...filters, [field]: event.target.value });
  };

  const handleReset = () => {
    const empty = Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: '' }), {});
    onChange(empty);
  };

  return (
    <Box mb={2}>
      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
        <TextField
          label="Start date"
          type="date"
          value={filters.startDate || ''}
          onChange={handleChange('startDate')}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="End date"
          type="date"
          value={filters.endDate || ''}
          onChange={handleChange('endDate')}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        {fields.map(({ name, label, options, includeEmpty = true }) => (
          <FormControl key={name} size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={filters[name] || ''}
              label={label}
              onChange={handleChange(name)}
            >
              {includeEmpty && (
                <MenuItem value="">
                  <em>Any {label.toLowerCase()}</em>
                </MenuItem>
              )}
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
        {showStatus && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Status"
              onChange={handleChange('status')}
            >
              <MenuItem value="">
                <em>All statuses</em>
              </MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {allowReset && (
          <Button size="small" onClick={handleReset} variant="outlined">
            Reset filters
          </Button>
        )}
      </Stack>
    </Box>
  );
};

FilterBar.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.any,
          label: PropTypes.string
        })
      ).isRequired,
      includeEmpty: PropTypes.bool
    })
  ),
  showStatus: PropTypes.bool,
  statusOptions: PropTypes.array,
  allowReset: PropTypes.bool
};

FilterBar.defaultProps = {
  fields: [],
  showStatus: false,
  statusOptions: [],
  allowReset: true
};

export default FilterBar;
