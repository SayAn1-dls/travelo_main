import { createContext, useContext, useReducer, useCallback } from 'react';
import { tripsDB } from '../lib/db';
import { generateMissionId } from '../utils/generateId';

const TripContext = createContext(null);

const ACTIONS = {
  LOAD:   'LOAD',
  ADD:    'ADD',
  UPDATE: 'UPDATE',
  REMOVE: 'REMOVE',
  SELECT: 'SELECT',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD:   return { ...state, trips: action.payload, loaded: true };
    case ACTIONS.ADD:    return { ...state, trips: [action.payload, ...state.trips] };
    case ACTIONS.UPDATE: return { ...state, trips: state.trips.map(t => t.id === action.payload.id ? action.payload : t) };
    case ACTIONS.REMOVE: return { ...state, trips: state.trips.filter(t => t.id !== action.payload) };
    case ACTIONS.SELECT: return { ...state, selected: action.payload };
    default: return state;
  }
}

export function TripProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { trips: [], loaded: false, selected: null });

  const loadTrips = useCallback(() => {
    dispatch({ type: ACTIONS.LOAD, payload: tripsDB.getAll() });
  }, []);

  const addTrip = useCallback((data) => {
    const trip = tripsDB.create(data);
    dispatch({ type: ACTIONS.ADD, payload: trip });
    return trip;
  }, []);

  const updateTrip = useCallback((id, patch) => {
    const updated = tripsDB.update(id, patch);
    dispatch({ type: ACTIONS.UPDATE, payload: updated });
  }, []);

  const removeTrip = useCallback((id) => {
    tripsDB.remove(id);
    dispatch({ type: ACTIONS.REMOVE, payload: id });
  }, []);

  const selectTrip = useCallback((trip) => {
    dispatch({ type: ACTIONS.SELECT, payload: trip });
  }, []);

  return (
    <TripContext.Provider value={{ ...state, loadTrips, addTrip, updateTrip, removeTrip, selectTrip }}>
      {children}
    </TripContext.Provider>
  );
}

export const useTrips = () => useContext(TripContext);
export default TripContext;
