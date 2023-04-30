import { component$ } from '@builder.io/qwik';
import {
  type DocumentHead,
  routeLoader$,
  Form,
  routeAction$,
} from '@builder.io/qwik-city';
import { auth } from '~/lib/lucia';

export const useUserLoader = routeLoader$(async (event) => {
  const authRequest = auth.handleRequest(event);
  const { user } = await authRequest.validateUser();

  if (!user) throw event.redirect(302, '/login');

  return {
    user,
  };
});

export const useSignoutAction = routeAction$(async (values, event) => {
  const authRequest = auth.handleRequest(event);
  const session = await authRequest.validate();

  if (!session) throw event.redirect(302, '/login');

  await auth.invalidateSession(session.sessionId);
  authRequest.setSession(null);
  throw event.redirect(302, '/login');
});

export default component$(() => {
  const userLoader = useUserLoader();
  const signoutAction = useSignoutAction();
  return (
    <>
      <p>
        This page is protected and can only be accessed by authenticated users.
      </p>
      <pre class="code">{JSON.stringify(userLoader.value.user, null, 2)}</pre>

      <Form action={signoutAction} class="button">
        <button type="submit">Sign out</button>
      </Form>
    </>
  );
});

export const head: DocumentHead = {
  title: 'Welcome to Qwik',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
};
