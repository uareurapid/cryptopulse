import memoize from "lodash.memoize";

export function invalidateCache(functionRef: any) {

    if(typeof functionRef === 'function') {
      functionRef.cache = new memoize.Cache();
    }
    
}