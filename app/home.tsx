/* eslint-disable @next/next/no-img-element */
'use client';

import './home.css';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  useEffect(() => {
    const postDescriptions = document.querySelectorAll('.post-desc');
    postDescriptions.forEach((desc) => {
      const text = desc.textContent || '';
      if (text.length > 110) {
        desc.textContent = text.substring(0, 110) + '...';
      }
    });

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      document.documentElement.classList.add('is-safari');
    }
  }, []);

  return (
    <>
      <main id="main">
        <div className="container viewport">
          <div className="grid-simple">
            <aside className="left">
              <div className="profile-circle dashed">
                <img src="https://media.licdn.com/dms/image/v2/D5603AQGRqqD4v04Amw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1731290152148?e=1758758400&v=beta&t=8KVFCwhsFjXnVd3QhKnoc-RcGc3OCaxwJdnXrNtEydU" alt="Jake Park" referrerPolicy="no-referrer" />
              </div>
              <div className="links dashed">
                <ul className="icon-list">
                  <li>
                    <a className="icon-btn icon-btn--linkedin" href="https://www.linkedin.com/in/eatnug/" target="_blank" rel="noopener" aria-label="LinkedIn">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/>
                        <text x="7" y="16" fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="11.5" fontWeight="700" fill="#ffffff">in</text>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a className="icon-btn" href="mailto:jake@thirdcommit.com" aria-label="Email">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="2"/>
                        <path d="M3 7l9 6l9-6"/>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a className="icon-btn" href="https://www.instagram.com/jake_cooked/" target="_blank" rel="noopener" aria-label="Instagram">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M16.5 7.5l0 .01"/></svg>
                    </a>
                  </li>
                  <li>
                    <a className="icon-btn" href="https://github.com/eatnug" target="_blank" rel="noopener" aria-label="GitHub">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 19c-4 1.5 -4 -2.5 -6 -3"/><path d="M15 22v-3.87a3.37 3.37 0 0 0 -.94 -2.61c3.14 -.35 6.44 -1.54 6.44 -7a5.44 5.44 0 0 0 -1.5 -3.75c.1 -1 .03 -2.25 -.59 -3.77c0 0 -1.18 -.35 -3.88 1.48a13.38 13.38 0 0 0 -7 0c-2.7 -1.83 -3.88 -1.48 -3.88 -1.48c-.62 1.52 -.69 2.77 -.59 3.77a5.44 5.44 0 0 0 -1.5 3.75c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0 -.94 2.61v3.87"/></svg>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="profile-name-txt">Jake Park</div>
              <div className="story dashed">
                <p className="mono">Software engineer. Desperately trying to keep up with this big, disruptive wave of innovation. Vibe-coding anything out of FOMO.</p>
                <p className="mono" style={{ marginTop: '1rem' }}>
                  <Link href="/blog" className="ext">
                    Read my blog →
                  </Link>
                </p>
              </div>
            </aside>

            <section className="right">
              <ul className="card-list">
                <li className="card-post dashed">
                  <div className="thumb"><span className="thumb-dot">?</span></div>
                  <div className="post-body">
                    <h3 className="post-title"><a className="ext" href="mailto:jake@thirdcommit.com" target="_blank" rel="noopener">What should I build next?</a></h3>
                    <p className="post-desc">Send me an idea.</p>
                  </div>
                </li>
                <li className="card-post dashed">
                  <div className="thumb"><span className="thumb-emoji">📰</span></div>
                  <div className="post-body">
                    <h3 className="post-title">My Feed (WIP)</h3>
                    <p className="post-desc">Fully customizable feed: add any source you follow (YouTube channels, Instagram accounts, blogs) and read everything without distractions.</p>
                  </div>
                </li>
                <li className="card-post dashed">
                  <div className="thumb"><img src="https://icons.duckduckgo.com/ip3/theterminalx.com.ico" alt="Terminal X logo" width="64" height="64" referrerPolicy="no-referrer" /></div>
                  <div className="post-body">
                    <h3 className="post-title"><a className="ext" href="https://theterminalx.com/" target="_blank" rel="noopener">Terminal X</a></h3>
                    <p className="post-desc">AI research agent for finance professionals. Retrieves news, analyzes market signals, and answers questions</p>
                  </div>
                </li>
                <li className="card-post dashed">
                  <div className="thumb"><img src="https://icons.duckduckgo.com/ip3/doctornow.co.kr.ico" alt="DoctorNow logo" width="64" height="64" referrerPolicy="no-referrer" /></div>
                  <div className="post-body">
                    <h3 className="post-title"><a className="ext" href="https://www.doctornow.co.kr/" target="_blank" rel="noopener">DoctorNow</a></h3>
                    <p className="post-desc">South Korea&apos;s leading telemedicine app, enabling 24/7 remote doctor consultations and prescription services.</p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}