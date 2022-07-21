import lucia from 'lucia-sveltekit';
import supabase from '@lucia-sveltekit/adapter-supabase';
import { prod } from '$app/env';

export const auth = lucia({
	adapter: supabase(
		'https://xzhigopmmnaxjzmenxbc.supabase.co',
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6aGlnb3BtbW5heGp6bWVueGJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY1NDA2NTc0NiwiZXhwIjoxOTY5NjQxNzQ2fQ.qG1CZN4iWRbY-7YLujC2UaMACeV_Yz9EQ-HMKx75rOA'
	),
	secret: 'YZPDIPI29zpIKGjnJOICoRy0tJmQVEVW',
	env: prod ? 'PROD' : 'DEV'
});
