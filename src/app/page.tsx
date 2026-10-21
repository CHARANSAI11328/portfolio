import { getDatabase } from '@/lib/db';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Projects from '@/components/Projects';
import Certifications from '@/components/Certifications';
import Experience from '@/components/Experience';
import Events from '@/components/Events';
import Team from '@/components/Team';
import Services from '@/components/Services';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default async function HomePage() {
  const db = getDatabase();

  const profile = db.profile;
  const publishedProjects = (db.projects || [])
    .filter((p) => p.published)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const publishedCerts = (db.certifications || [])
    .filter((c) => c.published)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const skills = (db.skills || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const experiences = (db.experiences || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const publishedEvents = (db.events || [])
    .filter((e) => e.published)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const team = (db.team || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const services = (db.services || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const visibility = db.settings?.sectionVisibility || {
    about: true,
    skills: true,
    projects: true,
    certifications: true,
    experience: true,
    events: true,
    team: true,
    services: true,
    contact: true,
  };

  return (
    <main className="min-h-screen flex flex-col relative bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <Hero profile={profile} />

      {visibility.about && <About profile={profile} />}

      {visibility.skills && <Skills skills={skills} />}

      {visibility.projects && <Projects projects={publishedProjects} />}

      {(visibility.team ?? true) && <Team team={team} />}

      {visibility.certifications && <Certifications certifications={publishedCerts} />}

      {visibility.experience && <Experience experiences={experiences} />}

      {visibility.events && <Events events={publishedEvents} />}

      {visibility.services && <Services services={services} />}

      {visibility.contact && <Contact profile={profile} />}

      <Footer profile={profile} />
    </main>
  );
}
