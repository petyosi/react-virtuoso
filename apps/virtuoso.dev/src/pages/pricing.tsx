import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";

export default function Pricing(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  const paddleConfig = siteConfig.customFields.paddle as any;
  // Create a local state to store Paddle instance
  const [paddle, setPaddle] = useState<Paddle>();

  // Download and initialize Paddle instance from CDN
  useEffect(() => {
    initializePaddle({
      environment: paddleConfig.environment,
      token: paddleConfig.token,
    }).then((paddleInstance: Paddle | undefined) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  return (
    <Layout
      title={`React Virtuoso Message List Pricing`}
      description="Description will go into a meta tag in <head />"
    >
      <div id="pricing">
        <h1>Pricing Plans</h1>

        <div id="pricing-blocks">
          <div>
            <h2>react-virtuoso</h2>

            <p className="license-kind">MIT Licensed, free forever.</p>

            <p className="license-coverage">
              The <code>Virtuoso</code>, <code>GroupedVirtuoso</code>,{" "}
              <code>VirtuosoGrid</code> and <code>VirtuosoTable</code>{" "}
              components.
            </p>

            <ul className="license-details">
              <li>Community support via GitHub.</li>
            </ul>

            <div className="price">
              <p>
                $<strong>0</strong>
              </p>
            </div>

            <div className="cta">
              <code>npm i react-virtuoso</code>
            </div>
          </div>

          <div>
            <h2>Message List</h2>

            <p className="license-kind">Annual Commercial License</p>

            <p className="license-coverage">
              The <code>VirtuosoMessageList</code> component.
            </p>

            <ul className="license-details">
              <li>One year access to updates.</li>
              <li>Email-based support.</li>
            </ul>

            <div className="price">
              <p>
                $<strong>14</strong>/month/seat
              </p>
              <p style={{ textAlign: "center" }}>
                Billed annualy at $168/seat.
              </p>
            </div>

            <div className="cta">
              <button
                style={{ padding: "10px 20px", fontSize: "20px" }}
                onClick={() =>
                  paddle?.Checkout.open({
                    items: [
                      {
                        priceId: paddleConfig.standardPriceId,
                        quantity: 1,
                      },
                    ],
                  })
                }
              >
                Buy Now
              </button>
            </div>
          </div>

          <div>
            <h2>Message List Pro</h2>

            <p className="license-kind">Annual Commercial License</p>

            <p className="license-coverage">
              The <code>VirtuosoMessageList</code> component.
            </p>

            <ul className="license-details">
              <li>One year access to updates.</li>
              <li>Email-based support, guaranteed response time.</li>
              <li>Priority feature requests.</li>
            </ul>

            <div className="price">
              <p>
                $<strong>26</strong>/month/seat
              </p>
              <p style={{ textAlign: "center" }}>
                Billed annualy at $<strong>312</strong>/seat.
              </p>
            </div>

            <div className="cta">
              <button
                style={{ padding: "10px 20px", fontSize: "20px" }}
                onClick={() =>
                  paddle?.Checkout.open({
                    items: [
                      {
                        priceId: paddleConfig.proPriceId,
                        quantity: 1,
                      },
                    ],
                  })
                }
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "4rem" }}>
          <h2>FAQ</h2>
          <h3>How many licenses do I need?</h3>
          <p>
            The number of licenses to the maximum number of concurrent front-end
            developers who contribute to a project that uses the package. This
            also includes developers who work on the project part-time or as
            contractors. See more details in in the{" "}
            <a href="/virtuoso-message-list/licensing">
              message list licensing section
            </a>
            .
          </p>
          <h3>What happens when I make a purchase?</h3>
          <p>
            You will receive a license key on the email you provide. You put the
            license key in the <code>licenseKey</code> prop of the{" "}
            <code>VirtuosoMessageListLicense</code> component and you're good to
            go.
          </p>
          <h3>What happens after my license expires?</h3>
          <p>
            The purchased license works indefinitely in production. If you want
            to continue active development using the component, you should
            update your subscription.
          </p>
          <h3>Can I try before I make a purchase decision?</h3>
          <p>
            Yes, you can use the package in development mode without a license
            for 30 days.
          </p>
          <h3>What's the guaranteed response time of the pro plan?</h3>
          <p>
            Within 2 business days, you're going to get a reply back from the
            authors of the package.
          </p>
          <h3>I have more questions</h3>
          <p>
            Reach out to{" "}
            <a href="mailto:support@virtuoso.dev">support@virtuoso.dev</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
