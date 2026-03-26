import { NavBar } from "../components/NavBar";

export const metadata = {
  title: "Methodology – Blocked Bus Stops in Manhattan",
  description:
    "How we collected and labeled illegal parking data at NYC bus stops.",
};

export default function Methodology() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active="methodology" />

      <main className="flex-1 px-4 py-10 flex justify-center">
        <article className="w-full max-w-2xl text-gray-200 space-y-6 text-[15px] leading-relaxed">
          {/* ── EDIT CONTENT BELOW ── */}
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Methodology
          </h1>
          <p>
            To understand the methodology, it’s important to define some terms
            and concepts related to bus stops.
          </p>
          {/* Example image — replace src and alt */}
          {/* <figure className="my-6">
            <img
              src="/your-image.png"
              alt="Description of image"
              className="rounded-lg w-full"
            />
            <figcaption className="text-xs text-gray-500 mt-2 text-center">
              Caption goes here.
            </figcaption>
          </figure> */}
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white mt-8">
            What is a bus stop?
          </h2>
          <p>
            Bus stops are “NO STANDING” zones{" "}
            <a
              href="https://www.nyc.gov/html/dot/downloads/pdf/parking-regulations-sign-legend.pdf"
              className=" hover:text-blue-300 underline underline-offset-2"
            >
              according to the DOT
            </a>{" "}
            (It’s the red text beneath the bus symbol). This means you may not
            wait or stop at these locations, but you may stop “expeditiously” to
            drop off or pick up passengers. Here’s a screenshot from the DOT
            website:
          </p>
          <figure className="my-6">
            <img src="/dot_bus_stop.png" className="rounded-lg w-full" />
          </figure>
          <p>
            There is also an arrow pointing against the flow of traffic. That
            arrow signifies that the no standing zone extends from the location
            of the sign until the end of the curb or until a different parking
            regulation is enacted by a different sign.
          </p>
          <p>
            Legally speaking, the MTA automated camera enforcement system{" "}
            <a
              href="https://www.mta.info/agency/new-york-city-transit/automated-camera-enforcement"
              className=" hover:text-blue-300 underline underline-offset-2"
            >
              (ACE)
            </a>
            issues a ticket to a vehicle stopped in a bus stop only after 2.5
            minutes and once it has been observed by two buses. The NYPD will
            also issue tickets for parking/standing in the bus stop with a less
            formal definition.
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white mt-8">
            In-Lane vs Pull-Out
          </h2>
          <p>
            Another important distinction in the world of bus stops is “In-Lane”
            vs. “Pull-Out” bus stops
          </p>
          <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white mt-8">
            In-Lane
          </h3>
          <figure className="my-6">
            <img src="/in-lane.jpg" className="rounded-lg w-full" />
          </figure>
          <p>
            An in-lane stop is a stop that is in a travel lane. Other vehicles
            are permitted to pass through the stop as part of regular travel.
            Therefore, for the purpose of this study – a car that is in motion
            in the lane was not considered “blocking”. Only if it was clear a
            car was parked more permanently or a delivery was taking place. This
            variety of stop is also not very common in New York City.
          </p>
          <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white mt-8">
            Pull-Out
          </h3>
          <figure className="my-6">
            <img src="/pull-out.jpg" className="rounded-lg w-full" />
          </figure>
          <p>
            The pull-out stop allows the bus to veer out of a travel lane to the
            curb. This is most bus stops in New York. In this case, any vehicle
            stopped in the lane will be considered “blocking”.
          </p>
          <p>
            Images courtesy of{" "}
            <a
              className=" hover:text-blue-300 underline underline-offset-2"
              href="https://globaldesigningcities.org/publication/global-street-design-guide/designing-streets-people/designing-transit-riders/transit-stops/stop-types/"
            >
              Global Designing Cities Initiative
            </a>
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white mt-8">
            Labelling{" "}
          </h2>
          <p>Now that we know what to look for – how do we find it?</p>
          <p>
            I decided to use Google Maps. There are more than 16,000 bus stops
            in New York – so a comprehensive study of every stop would be
            prohibitively expensive. By using Google Maps we can get what is
            effectively a random sampling of the status of every bus stop in New
            York. With large enough numbers this becomes an accurate estimate of
            any given moment. I’ve started by looking at M buses since Manhattan
            likely has the most issues with blocking – which also means this
            review is not meant to be an approximation of the entire city, only
            the borough of Manhattan.
          </p>
          <p>
            So that was the process – load each street view image, locate the
            bus stop, check for vehicles or /obstructions between the posted
            stop and the edge of the “no standing” zone. There are 1,828 stops
            on M bus routes, but I excluded a few stops along the M60 SBS which
            travels to LaGuardia airport. There were an additional 31 stops
            which were not labelled. These stops were either under construction
            at the time of the street view image, or had been moved, or I was
            otherwise unable to find an image.
          </p>
          <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-white mt-8">
            Examples
          </h3>
          <p>
            Some blocking is very obvious. In this example a large truck is
            completely filling the bus stop.
          </p>
          <figure className="my-6">
            <img
              src="/truck.png"
              alt="Truck blocking bus stop"
              className="rounded-lg w-full"
            />
            <figcaption className="text-xs text-gray-500 mt-2 text-center">
              A truck blocking a bus stop.
            </figcaption>
          </figure>
          <p>
            Here is an example of a vehicle parked at the back end of a pull-out
            bus stop. This prevents a bus from pulling directly into the stop
            after passing through the intersection
          </p>
          <figure className="my-6">
            <img
              src="/back-end.png"
              alt="back end of a pull-out bus stop"
              className="rounded-lg w-full"
            />
            <figcaption className="text-xs text-gray-500 mt-2 text-center">
              A truck blocking the back end of a pull-out bus stop.
            </figcaption>
          </figure>
          <p>
            This is an example of a car that is in the bus stop, but because the
            stop is in-lane the vehicle is permitted to be here, and therefore
            this is considered not blocking. Not to say this isn’t slowing down
            buses! This car is stopped at a red light, and now the bus must wait
            for the lane to clear to load or unload passengers.
          </p>
          <figure className="my-6">
            <img
              src="/in-lane-example.png"
              alt="An in-lane bus stop with a vehicle in the travel lane."
              className="rounded-lg w-full"
            />
            <figcaption className="text-xs text-gray-500 mt-2 text-center">
              An in-lane bus stop with a vehicle in the travel lane.
            </figcaption>
          </figure>
          <p>
            Overall, I was fairly lenient with deciding whether a stop was
            blocked. I feel confident that every blocked stop in the collection
            is causing a disruption to bus service.
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white mt-8">
            Additional Notes on Process
          </h2>
          <ul>
            <li>
              Most of the street view images are from 2024 or prior. This should
              not be interpreted as results of the MTA ACE program which began
              in August 2024.
            </li>
            <li>
              The focus of this research was strictly bus stops. Not bus lanes.
              So a clear bus stop in a bus lane which is blocked ahead would be
              considered clear.
            </li>
            To see an image of every blocked stop, you can go to the{" "}
            <a
              href="/gallery"
              className="text-white  hover:text-blue-300 underline underline-offset-2"
            >
              gallery
            </a>{" "}
            to see all of the blocked stops.
          </ul>
          {/* ── END EDITABLE CONTENT ── */}{" "}
          <p className="text-center mt-4  text-[11px] text-gray-600">
            made by{" "}
            <a
              href="https://patrickcleary.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#aaa] hover:underline"
            >
              Patrick Cleary
            </a>
          </p>
        </article>{" "}
      </main>
    </div>
  );
}
